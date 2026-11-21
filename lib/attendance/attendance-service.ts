import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  writeBatch,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import {
  Attendance,
  AttendanceFiltersState,
  AttendanceStats,
  CreateAttendanceDTO,
  UpdateAttendanceDTO,
  RelieverDetails,
} from '@/types/attendance';
import { INITIAL_ATTENDANCE_DATA, generateRosterForDate } from '@/lib/dummy-data';
import {
  checkDuplicateAttendance,
  calculateAttendanceStats,
  filterAttendanceRecords,
  formatToHHmm,
  generateDeterministicDocId,
  searchAttendance,
} from './attendance-utils';
import {
  validateAttendanceOrThrow,
} from './attendance-validation';

export class DuplicateAttendanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateAttendanceError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class FirebaseNotConfiguredError extends Error {
  constructor(message = 'Firebase environment variables are not configured in .env.local') {
    super(message);
    this.name = 'FirebaseNotConfiguredError';
  }
}

/**
 * AttendanceService:
 * Full-stack data service supporting Cloud Firestore with real-time onSnapshot listeners,
 * Firestore transactions for duplicate prevention, and an automated local fallback.
 */
class AttendanceService {
  private collectionName = 'attendance';

  // In-memory fallback data store
  private fallbackRecords: Attendance[] = INITIAL_ATTENDANCE_DATA.map((item) => ({
    ...item,
    name: item.name || item.employeeName || 'Unknown Employee',
    checkIn: formatToHHmm(item.checkIn),
    checkOut: formatToHHmm(item.checkOut),
    createdAt: item.createdAt || new Date('2026-11-20T08:00:00Z').toISOString(),
  }));

  constructor() {
    this.ensureTodayRosterInMemory();
  }

  private ensureTodayRosterInMemory() {
    const today = new Date().toISOString().split('T')[0];
    const hasToday = this.fallbackRecords.some((r) => r.date === today);
    if (!hasToday) {
      const todayRecords = generateRosterForDate(today);
      this.fallbackRecords = [...this.fallbackRecords, ...todayRecords];
    }
  }

  // Local subscription listeners when using fallback mode
  private localListeners: Set<(records: Attendance[]) => void> = new Set();

  private notifyLocalListeners() {
    const records = [...this.fallbackRecords];
    this.localListeners.forEach((listener) => {
      try {
        listener(records);
      } catch (e) {
        console.error('Local listener error:', e);
      }
    });
  }

  /**
   * Helper to convert Firestore timestamp or ISO string to ISO string.
   */
  private formatCreatedAt(val: unknown): string {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) {
      return val.toDate().toISOString();
    }
    if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
      return (val as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof val === 'string') return val;
    return new Date().toISOString();
  }

  /**
   * Checks whether Firebase is currently connected and ready.
   */
  isLiveFirestore(): boolean {
    return isFirebaseConfigured() && Boolean(db);
  }

  /**
   * Real-time subscription to attendance records using Firestore onSnapshot.
   * Cleans up cleanly when unsubscribe is invoked by the component.
   */
  subscribeToAttendance(
    onUpdate: (records: Attendance[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    // 1. Live Cloud Firestore onSnapshot subscription
    if (this.isLiveFirestore() && db) {
      try {
        const attendanceRef = collection(db, this.collectionName);
        const q = query(attendanceRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const records: Attendance[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                name: data.name || '',
                employeeName: data.name || '',
                department: data.department || '',
                branch: data.branch || 'Bannerghatta',
                date: data.date || '',
                checkIn: data.checkIn || '--:--',
                checkOut: data.checkOut || '--:--',
                status: data.status || 'Present',
                employeeId: data.employeeId || '',
                email: data.email || '',
                role: data.role || '',
                notes: data.notes || '',
                isReliever: Boolean(data.isReliever),
                coveringFor: data.coveringFor || '',
                relieverName: data.relieverName || '',
                relieverPhone: data.relieverPhone || '',
                relieverFromBranch: data.relieverFromBranch || '',
                createdAt: this.formatCreatedAt(data.createdAt),
              };
            });

            // Sort by date desc, name asc
            records.sort((a, b) => {
              const dateCmp = b.date.localeCompare(a.date);
              if (dateCmp !== 0) return dateCmp;
              return a.name.localeCompare(b.name);
            });

            onUpdate(records);

            // If today has no records in Firestore, automatically populate today's roster
            const today = new Date().toISOString().split('T')[0];
            const hasToday = records.some((r) => r.date === today);
            if (!hasToday) {
              this.ensureRosterForDate(today).catch(console.warn);
            }
          },
          (error) => {
            console.warn('Firestore onSnapshot notice (offline or reconnecting):', error);
            if ((error as { code?: string }).code === 'unavailable') {
              // Ensure user sees the Bangalore records while connection re-establishes
              onUpdate([...this.fallbackRecords]);
            }
            onError(error);
          }
        );

        return unsubscribe;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to subscribe to Firestore');
        onError(error);
        return () => {};
      }
    }

    // 2. Fallback in-memory subscription for local development or demo
    this.ensureTodayRosterInMemory();
    this.localListeners.add(onUpdate);
    onUpdate([...this.fallbackRecords]);

    return () => {
      this.localListeners.delete(onUpdate);
    };
  }

  /**
   * Retrieves all records with optional filters.
   */
  async getAttendanceRecords(filters?: Partial<AttendanceFiltersState>): Promise<Attendance[]> {
    let result: Attendance[] = [];

    if (this.isLiveFirestore() && db) {
      try {
        const attendanceRef = collection(db, this.collectionName);
        const q = query(attendanceRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);

        result = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || '',
            employeeName: data.name || '',
            department: data.department || '',
            branch: data.branch || 'Bannerghatta',
            date: data.date || '',
            checkIn: data.checkIn || '--:--',
            checkOut: data.checkOut || '--:--',
            status: data.status || 'Present',
            employeeId: data.employeeId || '',
            email: data.email || '',
            role: data.role || '',
            notes: data.notes || '',
            isReliever: Boolean(data.isReliever),
            coveringFor: data.coveringFor || '',
            relieverName: data.relieverName || '',
            relieverPhone: data.relieverPhone || '',
            relieverFromBranch: data.relieverFromBranch || '',
            createdAt: this.formatCreatedAt(data.createdAt),
          };
        });
      } catch (err) {
        console.warn('Firestore fetch failed, falling back to local memory:', err);
        result = [...this.fallbackRecords];
      }
    } else {
      result = [...this.fallbackRecords];
    }

    if (filters) {
      const fullFilters: AttendanceFiltersState = {
        searchQuery: filters.searchQuery || '',
        department: filters.department || '',
        branch: filters.branch || '',
        status: filters.status || '',
        date: filters.date || '',
      };
      result = filterAttendanceRecords(result, fullFilters);
    }

    return result.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Retrieves a single record by ID.
   */
  async getAttendanceById(id: string): Promise<Attendance | null> {
    if (this.isLiveFirestore() && db) {
      try {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          employeeName: data.name || '',
          department: data.department || '',
          branch: data.branch || 'Bannerghatta',
          date: data.date || '',
          checkIn: data.checkIn || '--:--',
          checkOut: data.checkOut || '--:--',
          status: data.status || 'Present',
          employeeId: data.employeeId || '',
          email: data.email || '',
          notes: data.notes || '',
          createdAt: this.formatCreatedAt(data.createdAt),
        };
      } catch (e) {
        console.warn('Firestore getById failed, checking fallback:', e);
      }
    }

    const record = this.fallbackRecords.find((r) => r.id === id);
    return record ? { ...record } : null;
  }

  /**
   * Creates an attendance record with transactional duplicate prevention.
   */
  async createAttendance(data: CreateAttendanceDTO): Promise<Attendance> {
    const candidateName = (data.name ?? data.employeeName ?? '').trim();

    // 1. Validate payload
    validateAttendanceOrThrow({
      ...data,
      name: candidateName,
    });

    const isAbsent = data.status === 'Absent';
    const employeeId = data.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const email = data.email || `${candidateName.toLowerCase().replace(/\s+/g, '.')}@company.com`;
    const checkIn = isAbsent ? '--:--' : formatToHHmm(data.checkIn);
    const checkOut = isAbsent ? '--:--' : formatToHHmm(data.checkOut);

    // 2. LIVE FIRESTORE: Transactional Duplicate Prevention & Document Creation
    if (this.isLiveFirestore() && db) {
      // Deterministic document ID to strictly guarantee uniqueness at the Firestore database level
      const docId = data.id || generateDeterministicDocId(candidateName, data.date, employeeId);
      const docRef = doc(db, this.collectionName, docId);

      await runTransaction(db, async (transaction) => {
        const existingDoc = await transaction.get(docRef);
        if (existingDoc.exists()) {
          throw new DuplicateAttendanceError(
            `An attendance record for "${candidateName}" on ${data.date} already exists in Firestore.`
          );
        }

        transaction.set(docRef, {
          name: candidateName,
          department: data.department,
          branch: data.branch || 'Bannerghatta',
          date: data.date.trim(),
          checkIn,
          checkOut,
          status: data.status,
          employeeId,
          email,
          notes: data.notes?.trim() || '',
          createdAt: serverTimestamp(),
        });
      });

      return {
        id: docId,
        name: candidateName,
        employeeName: candidateName,
        department: data.department,
        branch: data.branch || 'Bannerghatta',
        date: data.date.trim(),
        checkIn,
        checkOut,
        status: data.status,
        employeeId,
        email,
        notes: data.notes?.trim() || '',
        createdAt: new Date().toISOString(),
      };
    }

    // 3. FALLBACK LOCAL: In-memory store
    const dupCheck = checkDuplicateAttendance(this.fallbackRecords, {
      name: candidateName,
      date: data.date,
      employeeId,
    });

    if (dupCheck.isDuplicate) {
      throw new DuplicateAttendanceError(
        dupCheck.message || `An attendance record for "${candidateName}" on ${data.date} already exists.`
      );
    }

    const newRecord: Attendance = {
      id: data.id || generateDeterministicDocId(candidateName, data.date, employeeId),
      name: candidateName,
      employeeName: candidateName,
      employeeId,
      email,
      department: data.department,
      branch: data.branch || 'Bannerghatta',
      date: data.date.trim(),
      checkIn,
      checkOut,
      status: data.status,
      notes: data.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    this.fallbackRecords = [newRecord, ...this.fallbackRecords];
    this.notifyLocalListeners();

    return { ...newRecord };
  }

  /**
   * Updates an existing attendance record.
   */
  async updateAttendance(id: string, data: UpdateAttendanceDTO): Promise<Attendance> {
    const existing = await this.getAttendanceById(id);
    if (!existing) {
      throw new NotFoundError(`Attendance record with ID "${id}" was not found.`);
    }

    const candidateName = (data.name ?? data.employeeName ?? existing.name).trim();
    const candidateDate = (data.date ?? existing.date).trim();
    const candidateStatus = data.status ?? existing.status;
    const isAbsent = candidateStatus === 'Absent';

    // 1. Validate updated payload
    validateAttendanceOrThrow({
      ...existing,
      ...data,
      name: candidateName,
      date: candidateDate,
      status: candidateStatus,
    });

    const checkIn = isAbsent ? '--:--' : formatToHHmm(data.checkIn ?? existing.checkIn);
    const checkOut = isAbsent ? '--:--' : formatToHHmm(data.checkOut ?? existing.checkOut);

    // 2. LIVE FIRESTORE
    if (this.isLiveFirestore() && db) {
      const docRef = doc(db, this.collectionName, id);

      // Check duplicate if name or date changed
      if (candidateName !== existing.name || candidateDate !== existing.date) {
        const dupId = generateDeterministicDocId(candidateName, candidateDate, existing.employeeId);
        if (dupId !== id) {
          const dupDoc = await getDoc(doc(db, this.collectionName, dupId));
          if (dupDoc.exists()) {
            throw new DuplicateAttendanceError(
              `An attendance record for "${candidateName}" on ${candidateDate} already exists.`
            );
          }
        }
      }

      await updateDoc(docRef, {
        name: candidateName,
        department: data.department ?? existing.department,
        branch: data.branch ?? existing.branch ?? 'Bannerghatta',
        date: candidateDate,
        status: candidateStatus,
        checkIn,
        checkOut,
        notes: data.notes !== undefined ? data.notes.trim() : existing.notes,
        // createdAt is intentionally preserved
      });

      return {
        ...existing,
        ...data,
        name: candidateName,
        employeeName: candidateName,
        department: data.department ?? existing.department,
        branch: data.branch ?? existing.branch ?? 'Bannerghatta',
        date: candidateDate,
        status: candidateStatus,
        checkIn,
        checkOut,
      };
    }

    // 3. FALLBACK LOCAL
    const dupCheck = checkDuplicateAttendance(this.fallbackRecords, {
      id,
      name: candidateName,
      date: candidateDate,
      employeeId: data.employeeId ?? existing.employeeId,
    });

    if (dupCheck.isDuplicate) {
      throw new DuplicateAttendanceError(
        dupCheck.message || `An attendance record for "${candidateName}" on ${candidateDate} already exists.`
      );
    }

    const updated: Attendance = {
      ...existing,
      ...data,
      name: candidateName,
      employeeName: candidateName,
      department: data.department ?? existing.department,
      branch: data.branch ?? existing.branch ?? 'Bannerghatta',
      date: candidateDate,
      status: candidateStatus,
      checkIn,
      checkOut,
    };

    const idx = this.fallbackRecords.findIndex((r) => r.id === id);
    if (idx !== -1) {
      this.fallbackRecords[idx] = updated;
      this.notifyLocalListeners();
    }

    return updated;
  }

  /**
   * Deletes an attendance record by ID.
   */
  async deleteAttendance(id: string): Promise<boolean> {
    if (this.isLiveFirestore() && db) {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new NotFoundError(`Attendance record with ID "${id}" was not found.`);
      }
      await deleteDoc(docRef);
      return true;
    }

    const idx = this.fallbackRecords.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new NotFoundError(`Attendance record with ID "${id}" was not found.`);
    }

    this.fallbackRecords = this.fallbackRecords.filter((r) => r.id !== id);
    this.notifyLocalListeners();
    return true;
  }

  /**
   * Seeds Cloud Firestore with initial sample records (one-click helper).
   */
  async seedFirestoreWithSampleData(): Promise<{ count: number }> {
    if (!this.isLiveFirestore() || !db) {
      throw new FirebaseNotConfiguredError();
    }

    let seededCount = 0;
    for (const record of INITIAL_ATTENDANCE_DATA) {
      const docId = generateDeterministicDocId(record.name, record.date, record.employeeId);
      const docRef = doc(db, this.collectionName, docId);
      const existing = await getDoc(docRef);

      if (!existing.exists()) {
        const isAbsent = record.status === 'Absent';
        await runTransaction(db, async (t) => {
          t.set(docRef, {
            name: record.name,
            department: record.department,
            branch: record.branch || 'Bannerghatta',
            date: record.date,
            checkIn: isAbsent ? '--:--' : formatToHHmm(record.checkIn),
            checkOut: isAbsent ? '--:--' : formatToHHmm(record.checkOut),
            status: record.status,
            employeeId: record.employeeId,
            email: record.email,
            notes: record.notes || '',
            createdAt: serverTimestamp(),
          });
        });
        seededCount++;
      }
    }

    return { count: seededCount };
  }

  /**
   * Ensures all 62 employees in the master roster are populated for the specified date.
   * If some employees (or a test employee) already exist, it fills in any missing employees.
   */
  async ensureRosterForDate(targetDate: string): Promise<{ count: number }> {
    const isLive = this.isLiveFirestore();
    const roster = generateRosterForDate(targetDate);
    let addedCount = 0;

    if (isLive && db) {
      try {
        const attendanceRef = collection(db, this.collectionName);
        const q = query(attendanceRef, where('date', '==', targetDate));
        const snap = await getDocs(q);

        // Map existing employees by normalized name or employeeId
        const existingSet = new Set<string>();
        snap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const name = (d.name || '').toLowerCase().trim();
          const empId = (d.employeeId || '').toLowerCase().trim();
          if (name) existingSet.add(name);
          if (empId) existingSet.add(empId);
        });

        for (const record of roster) {
          const nameKey = record.name.toLowerCase().trim();
          const empIdKey = (record.employeeId || '').toLowerCase().trim();

          // Only create if this employee isn't recorded for this date yet
          if (!existingSet.has(nameKey) && !existingSet.has(empIdKey)) {
            const docId = generateDeterministicDocId(record.name, targetDate, record.employeeId);
            const docRef = doc(db, this.collectionName, docId);
            await setDoc(docRef, {
              name: record.name,
              department: record.department,
              branch: record.branch || 'Bannerghatta',
              date: targetDate,
              checkIn: record.checkIn,
              checkOut: record.checkOut,
              status: record.status,
              employeeId: record.employeeId,
              email: record.email,
              role: record.role,
              notes: record.notes || 'On-Duty regular hours',
              createdAt: serverTimestamp(),
            });
            addedCount++;
          }
        }
        return { count: snap.size + addedCount };
      } catch (err) {
        console.warn('Failed to ensure roster in Firestore, falling back to local:', err);
      }
    }

    // In-memory fallback
    const existingSet = new Set<string>();
    this.fallbackRecords
      .filter((r) => r.date === targetDate)
      .forEach((r) => {
        const name = (r.name || r.employeeName || '').toLowerCase().trim();
        const empId = (r.employeeId || '').toLowerCase().trim();
        if (name) existingSet.add(name);
        if (empId) existingSet.add(empId);
      });

    const missingRecords = roster.filter((r) => {
      const nameKey = r.name.toLowerCase().trim();
      const empIdKey = (r.employeeId || '').toLowerCase().trim();
      return !existingSet.has(nameKey) && !existingSet.has(empIdKey);
    });

    if (missingRecords.length > 0) {
      this.fallbackRecords = [...this.fallbackRecords, ...missingRecords];
      this.notifyLocalListeners();
      addedCount = missingRecords.length;
    }

    const totalForDate = this.fallbackRecords.filter((r) => r.date === targetDate).length;
    return { count: totalForDate };
  }

  /**
   * Resets auto-seeded records for a date from Present to Pending so that Present Today starts at 0,
   * matching real-world workflow where presence is only marked via Edit or Excel upload.
   */
  async resetUnverifiedToPending(targetDate: string): Promise<number> {
    const isLive = this.isLiveFirestore();
    let updatedCount = 0;

    if (isLive && db) {
      try {
        const attendanceRef = collection(db, this.collectionName);
        const q = query(attendanceRef, where('date', '==', targetDate));
        const snap = await getDocs(q);
        const batch = writeBatch(db);

        snap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          const name = (d.name || '').toLowerCase().trim();
          // Reset only auto-generated records that are falsely marked Present before verification
          if (
            d.status === 'Present' &&
            name !== 'test' &&
            !d.isReliever &&
            !d.relieverName
          ) {
            batch.update(docSnap.ref, {
              status: 'Pending',
              checkIn: '--:--',
              checkOut: '--:--',
              notes: 'Pending attendance marking / Excel upload',
            });
            updatedCount++;
          }
        });

        if (updatedCount > 0) {
          await batch.commit();
        }
        return updatedCount;
      } catch (err) {
        console.warn('resetUnverifiedToPending error:', err);
      }
    }

    // In-memory fallback
    this.fallbackRecords = this.fallbackRecords.map((r) => {
      const name = (r.name || r.employeeName || '').toLowerCase().trim();
      if (
        r.date === targetDate &&
        r.status === 'Present' &&
        name !== 'test' &&
        !r.isReliever &&
        !r.relieverName
      ) {
        updatedCount++;
        return {
          ...r,
          status: 'Pending',
          checkIn: '--:--',
          checkOut: '--:--',
          notes: 'Pending attendance marking / Excel upload',
        };
      }
      return r;
    });

    if (updatedCount > 0) {
      this.notifyLocalListeners();
    }

    return updatedCount;
  }

  /**
   * Bulk imports attendance records from an Excel / CSV upload.
   * Efficiently upserts all records into Firestore using writeBatch or local fallback.
   */
  async bulkImportAttendance(records: Attendance[]): Promise<{ count: number }> {
    if (records.length === 0) return { count: 0 };

    const isLive = this.isLiveFirestore();
    if (isLive && db) {
      const batch = writeBatch(db);
      for (const rec of records) {
        const docId = generateDeterministicDocId(rec.name, rec.date, rec.employeeId);
        const docRef = doc(db, this.collectionName, docId);
        batch.set(
          docRef,
          {
            name: rec.name,
            department: rec.department,
            branch: rec.branch,
            date: rec.date,
            checkIn: rec.checkIn,
            checkOut: rec.checkOut,
            status: rec.status,
            employeeId: rec.employeeId,
            email: rec.email,
            role: rec.role,
            notes: rec.notes || '',
            isReliever: Boolean(rec.isReliever),
            relieverName: rec.relieverName || '',
            relieverPhone: rec.relieverPhone || '',
            relieverFromBranch: rec.relieverFromBranch || '',
            coveringFor: rec.coveringFor || '',
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      await batch.commit();
      return { count: records.length };
    }

    // In-memory fallback
    const incomingMap = new Map<string, Attendance>();
    records.forEach((r) => {
      const key = `${r.name.toLowerCase().trim()}_${r.date}`;
      incomingMap.set(key, r);
    });

    const updatedFallback = this.fallbackRecords.filter((r) => {
      const key = `${(r.name || r.employeeName || '').toLowerCase().trim()}_${r.date}`;
      return !incomingMap.has(key);
    });

    this.fallbackRecords = [...records, ...updatedFallback];
    this.notifyLocalListeners();
    return { count: records.length };
  }

  /**
   * Computes statistics dynamically.
   */
  async calculateStatistics(targetDate?: string): Promise<AttendanceStats> {
    const allRecords = await this.getAttendanceRecords();
    return calculateAttendanceStats(allRecords, targetDate);
  }

  /**
   * Assigns a reliever / replacement employee to cover for an absent staff member.
   */
  async assignReliever(
    absentRecordId: string,
    reliever: RelieverDetails
  ): Promise<{ absentRecord: Attendance; relieverRecord: Attendance }> {
    const isLive = this.isLiveFirestore();
    const cleanRelieverName = reliever.relieverName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanBranch = reliever.toBranch.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const relieverRecordId = `reliever_${reliever.date}_${cleanRelieverName}_${cleanBranch}`;
    const relieverEmployeeId = `EMP-REL-${Date.now().toString().slice(-4)}`;

    const isABM =
      reliever.role?.toLowerCase().includes('assistant') ||
      reliever.role?.toUpperCase() === 'ABM';

    const relieverData: Attendance = {
      id: relieverRecordId,
      name: reliever.relieverName,
      employeeName: reliever.relieverName,
      department: isABM ? 'ABM' : 'BM',
      branch: reliever.toBranch,
      date: reliever.date,
      checkIn: reliever.checkIn || '09:30',
      checkOut: reliever.checkOut || '18:30',
      status: 'Present',
      role: isABM ? 'Assistant Branch Manager' : 'Branch Manager',
      employeeId: relieverEmployeeId,
      email: `${reliever.relieverName.toLowerCase().replace(/[^a-z0-9]/g, '')}@atticagold.com`,
      notes: reliever.notes || `Covering duties for staff`,
      isReliever: true,
      relieverPhone: reliever.relieverPhone || '',
      relieverFromBranch: reliever.fromBranch,
      createdAt: new Date().toISOString(),
    };

    if (isLive && db) {
      const absentDocRef = doc(db, this.collectionName, absentRecordId);
      const absentSnap = await getDoc(absentDocRef);
      if (!absentSnap.exists()) {
        throw new NotFoundError(`Absent record ${absentRecordId} not found`);
      }
      const absentData = absentSnap.data();
      const absentStaffName = absentData.name || 'Absent Staff';
      relieverData.coveringFor = absentStaffName;

      // Mark the staff being relieved as Absent (on leave) with full reliever details
      await updateDoc(absentDocRef, {
        status: 'Absent',
        relieverName: reliever.relieverName,
        relieverPhone: reliever.relieverPhone || '',
        relieverFromBranch: reliever.fromBranch,
        notes: `On leave - Covered by Reliever ${reliever.relieverName}`,
      });

      // Save/update the reliever record (deterministic ID avoids duplicate rows)
      const relieverDocRef = doc(db, this.collectionName, relieverRecordId);
      await setDoc(relieverDocRef, {
        ...relieverData,
        createdAt: serverTimestamp(),
      }, { merge: true });

      // Automatically remove any previous home-branch record for this same person on this date
      // so an employee is NEVER duplicated or shown 2 times in the system
      try {
        const q = query(
          collection(db, this.collectionName),
          where('date', '==', reliever.date)
        );
        const existingSnaps = await getDocs(q);
        for (const d of existingSnaps.docs) {
          const dData = d.data();
          const dName = (dData.name || dData.employeeName || '').toLowerCase().trim();
          if (
            d.id !== relieverRecordId &&
            d.id !== absentRecordId &&
            dName === reliever.relieverName.toLowerCase().trim()
          ) {
            await deleteDoc(d.ref);
          }
        }
      } catch (cleanErr) {
        console.warn('Notice: Previous home branch cleanup check:', cleanErr);
      }

      return {
        absentRecord: {
          ...absentData,
          id: absentRecordId,
          status: 'Absent',
          relieverName: reliever.relieverName,
          relieverPhone: reliever.relieverPhone || '',
          relieverFromBranch: reliever.fromBranch,
          notes: `On leave - Covered by Reliever ${reliever.relieverName}`,
        } as Attendance,
        relieverRecord: relieverData,
      };
    } else {
      // Local fallback mode
      const idx = this.fallbackRecords.findIndex((r) => r.id === absentRecordId);
      let coveringForName = 'Staff';
      if (idx !== -1) {
        coveringForName = this.fallbackRecords[idx].name;
        this.fallbackRecords[idx] = {
          ...this.fallbackRecords[idx],
          status: 'Absent',
          relieverName: reliever.relieverName,
          relieverPhone: reliever.relieverPhone || '',
          relieverFromBranch: reliever.fromBranch,
          notes: `On leave - Covered by Reliever ${reliever.relieverName}`,
        };
      }
      relieverData.coveringFor = coveringForName;

      // Remove any previous record for this reliever on this date so they only appear once
      this.fallbackRecords = this.fallbackRecords.filter(
        (r) =>
          !(
            r.id !== absentRecordId &&
            (r.name || r.employeeName || '').toLowerCase().trim() === reliever.relieverName.toLowerCase().trim() &&
            r.date === reliever.date
          )
      );

      this.fallbackRecords.unshift(relieverData);
      this.notifyLocalListeners();

      return {
        absentRecord: idx !== -1 ? this.fallbackRecords[idx] : ({} as Attendance),
        relieverRecord: relieverData,
      };
    }
  }

  /**
   * Searches records matching a query text.
   */
  async searchAttendance(query: string): Promise<Attendance[]> {
    const records = await this.getAttendanceRecords();
    return searchAttendance(records, query);
  }
}

export const attendanceService = new AttendanceService();

// Reusable individual exports
export const assignReliever = (
  absentRecordId: string,
  reliever: RelieverDetails
) => attendanceService.assignReliever(absentRecordId, reliever);

// Reusable individual exports
export const subscribeToAttendance = (
  onUpdate: (records: Attendance[]) => void,
  onError: (error: Error) => void
) => attendanceService.subscribeToAttendance(onUpdate, onError);

export const getAttendanceRecords = (filters?: Partial<AttendanceFiltersState>) =>
  attendanceService.getAttendanceRecords(filters);

export const getAttendanceById = (id: string) =>
  attendanceService.getAttendanceById(id);

export const createAttendance = (data: CreateAttendanceDTO) =>
  attendanceService.createAttendance(data);

export const updateAttendance = (id: string, data: UpdateAttendanceDTO) =>
  attendanceService.updateAttendance(id, data);

export const deleteAttendance = (id: string) =>
  attendanceService.deleteAttendance(id);

export const calculateAttendanceStatistics = (targetDate?: string) =>
  attendanceService.calculateStatistics(targetDate);

export const ensureRosterForDate = (targetDate: string) =>
  attendanceService.ensureRosterForDate(targetDate);

export const bulkImportAttendance = (records: Attendance[]) =>
  attendanceService.bulkImportAttendance(records);

export const resetUnverifiedToPending = (targetDate: string) =>
  attendanceService.resetUnverifiedToPending(targetDate);
