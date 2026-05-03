<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function indexMyNotifications(Request $request): JsonResponse
    {
        $notifications = Notification::with(['student'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($notifications);
    }

    public function sendToStudent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'type' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'meta' => ['nullable', 'array'],
        ]);

        $student = Student::with('user')->findOrFail($validated['student_id']);

        $notification = Notification::create([
            'user_id' => $student->user_id,
            'student_id' => $student->id,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'message' => $validated['message'],
            'meta' => $validated['meta'] ?? null,
            'is_read' => false,
            'read_at' => null,
        ]);

        return response()->json([
            'message' => 'Notification sent to student successfully.',
            'data' => $notification->load(['user', 'student']),
        ], 201);
    }

    public function sendToAllStudents(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'meta' => ['nullable', 'array'],
        ]);

        $students = Student::with('user')->get();

        $created = 0;

        DB::transaction(function () use ($students, $validated, &$created) {
            foreach ($students as $student) {
                Notification::create([
                    'user_id' => $student->user_id,
                    'student_id' => $student->id,
                    'type' => $validated['type'],
                    'title' => $validated['title'],
                    'message' => $validated['message'],
                    'meta' => $validated['meta'] ?? null,
                    'is_read' => false,
                    'read_at' => null,
                ]);

                $created++;
            }
        });

        return response()->json([
            'message' => 'Notification sent to all students successfully.',
            'created_notifications_count' => $created,
        ]);
    }

    public function markAsRead(Request $request, int $notificationId): JsonResponse
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($notificationId);

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'message' => 'Notification marked as read.',
            'data' => $notification->fresh(),
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }

    public function show(int $notificationId): JsonResponse
    {
        $notification = Notification::with(['user', 'student'])
            ->findOrFail($notificationId);

        return response()->json($notification);
    }

    public function indexAll(): JsonResponse
    {
        $notifications = Notification::with(['user', 'student'])
            ->latest()
            ->paginate(20);

        return response()->json($notifications);
    }
}
