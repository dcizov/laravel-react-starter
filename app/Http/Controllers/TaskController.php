<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    /**
     * The signed-in user's tasks. Only the columns the Tasks page shows are sent.
     */
    public function index(Request $request): Response
    {
        $tasks = $request->user()
            ->tasks()
            ->orderBy('id')
            ->get(['id', 'code', 'title', 'status', 'label', 'priority']);

        return Inertia::render('tasks', [
            'tasks' => $tasks,
        ]);
    }
}
