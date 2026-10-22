<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Read-only view of the audit log. Shows the newest entries first.
 */
class AuditLogController extends Controller
{
    public function index(): Response
    {
        $entries = AuditLog::query()
            ->with(['actor:id,name', 'impersonator:id,name'])
            ->orderByDesc('id')
            ->limit(500)
            ->get()
            ->map(fn (AuditLog $entry) => [
                'id' => $entry->id,
                'createdAt' => $entry->created_at->toIso8601String(),
                'actor' => $entry->actor === null ? '—' : $entry->actor->name,
                'impersonator' => $entry->impersonator?->name,
                'action' => $entry->action,
                'subject' => $entry->subject_label ?? '—',
                'ipAddress' => $entry->ip_address ?? '—',
                'details' => $entry->properties ? json_encode($entry->properties) : '',
            ]);

        return Inertia::render('admin/audit-log', [
            'entries' => $entries,
        ]);
    }
}
