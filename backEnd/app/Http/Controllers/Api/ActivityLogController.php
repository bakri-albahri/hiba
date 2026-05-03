<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = ActivityLog::with('user')
            ->when($request->filled('action'), function ($query) use ($request) {
                $query->where('action', $request->action);
            })
            ->when($request->filled('target_type'), function ($query) use ($request) {
                $query->where('target_type', $request->target_type);
            })
            ->when($request->filled('user_id'), function ($query) use ($request) {
                $query->where('user_id', $request->user_id);
            })
            ->latest()
            ->paginate(30);

        $logs->getCollection()->transform(function ($log) {
            return $this->transformLog($log);
        });

        return response()->json($logs);
    }

    public function show(int $logId): JsonResponse
    {
        $log = ActivityLog::with('user')->findOrFail($logId);

        return response()->json($this->transformLog($log));
    }

    public function myLogs(Request $request): JsonResponse
    {
        $logs = ActivityLog::with('user')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(30);

        $logs->getCollection()->transform(function ($log) {
            return $this->transformLog($log);
        });

        return response()->json($logs);
    }

    private function transformLog(ActivityLog $log): array
    {
        return [
            'id' => $log->id,
            'action' => $log->action,
            'target_type' => $log->target_type,
            'target_id' => $log->target_id,
            'title' => $log->title,
            'description' => $log->description,
            'performed_by' => [
                'user_id' => $log->user?->id,
                'full_name' => $log->user?->full_name,
                'email' => $log->user?->email,
                'type' => $log->user?->type,
            ],
            'performed_at' => $log->created_at,
            'operation_details' => [
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'meta' => $log->meta,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
            ],
            'created_at' => $log->created_at,
            'updated_at' => $log->updated_at,
        ];
    }
}