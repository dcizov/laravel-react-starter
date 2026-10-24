<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    public function destroy(Request $request, Invitation $invitation): RedirectResponse
    {
        abort_unless($request->user()?->can('users.manage'), 403);

        $invitation->delete();

        return back()->with('toast', [
            'type' => 'success',
            'message' => "Invitation for {$invitation->email} revoked.",
        ]);
    }
}
