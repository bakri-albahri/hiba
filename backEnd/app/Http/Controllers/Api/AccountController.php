<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AccountController extends Controller
{
    public function changeMyPassword(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        if (Hash::check($validated['new_password'], $user->password)) {
            return response()->json([
                'message' => 'The new password must be different from the current password.',
            ], 422);
        }

        $user->update([
            'password' => $validated['new_password'],
        ]);

        $activityLogService->log(
            $user->id,
            'user_password_changed',
            'user',
            $user->id,
            'User Password Changed',
            'The authenticated user changed their password.',
            null,
            [
                'user_type' => $user->type,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }
}