import { NextRequest, NextResponse } from 'next/server';
import {
  attendanceService,
  DuplicateAttendanceError,
} from '@/lib/attendance/attendance-service';
import { AttendanceValidationError } from '@/lib/attendance/attendance-validation';

/**
 * GET /api/attendance
 * Retrieves attendance records with optional filtering (searchQuery, department, status, date).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('searchQuery') || searchParams.get('q') || '';
    const department = searchParams.get('department') || '';
    const status = searchParams.get('status') || '';
    const date = searchParams.get('date') || '';

    const records = await attendanceService.getAttendanceRecords({
      searchQuery,
      department,
      status,
      date,
    });

    const stats = await attendanceService.calculateStatistics(date || undefined);

    return NextResponse.json(
      {
        success: true,
        data: records,
        stats,
        total: records.length,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve attendance records';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendance
 * Creates a new attendance record with validation and duplicate prevention.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const createdRecord = await attendanceService.createAttendance(body);

    return NextResponse.json(
      {
        success: true,
        data: createdRecord,
        message: 'Attendance record created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AttendanceValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    if (error instanceof DuplicateAttendanceError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'DUPLICATE_RECORD',
        },
        { status: 409 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to create attendance record';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
