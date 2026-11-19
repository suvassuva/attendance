import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
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
} from '@/types/attendance';
import { INITIAL_ATTENDANCE_DATA } from '@/lib/dummy-data';
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
    createdAt: item.createdAt || new Date('2026-11-19T08:00:00Z').toISOString(),
  }));

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
                date: data.date || '',
                checkIn: data.checkIn || '--:--',
                checkOut: data.checkOut || '--:--',
                status: data.status || 'Present',
                employeeId: data.employeeId || '',
                email: data.email || '',
                notes: data.notes || '',
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
          },
          (error) => {
            console.error('Firestore onSnapshot listener error:', error);
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
            date: data.date || '',
            checkIn: data.checkIn || '--:--',
            checkOut: data.checkOut || '--:--',
            status: data.status || 'Present',
            employeeId: data.employeeId || '',
            email: data.email || '',
            notes: data.notes || '',
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
   * Computes statistics dynamically.
   */
  async calculateStatistics(targetDate?: string): Promise<AttendanceStats> {
    const allRecords = await this.getAttendanceRecords();
    return calculateAttendanceStats(allRecords, targetDate);
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
