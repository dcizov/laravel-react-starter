<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    // Sample tasks are static data. Nothing is stored, so the page is read-only on the server.
    public function index(): Response
    {
        $tasks = json_decode(File::get(resource_path('data/tasks.json')), true, flags: JSON_THROW_ON_ERROR);

        return Inertia::render('tasks', [
            'tasks' => $tasks,
        ]);
    }
}
