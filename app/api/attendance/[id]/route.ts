import { NextRequest, NextResponse } from 'next/server';
import {
  attendanceService,
  DuplicateAttendanceError,
  NotFoundError,
} from '@/lib/attendance/attendance-service';
import { AttendanceValidationError } from '@/lib/attendance/attendance-validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/attendance/[id]
 * Retrieves a single attendance record by ID.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const record = await attendanceService.getAttendanceById(id);

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: `Attendance record with ID "${id}" was not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: record,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve attendance record';
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
 * PATCH /api/attendance/[id]
 * Updates an attendance record with validation and duplicate prevention.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await attendanceService.updateAttendance(id, body);

    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: 'Attendance record updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

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

    const message = error instanceof Error ? error.message : 'Failed to update attendance record';
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
 * DELETE /api/attendance/[id]
 * Deletes an attendance record by ID.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    await attendanceService.deleteAttendance(id);

    return NextResponse.json(
      {
        success: true,
        message: `Attendance record "${id}" was deleted successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 404 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to delete attendance record';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
