<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
    Schema::create('barber_attendances', function (Blueprint $table) {
        $table->id();
        $table->foreignId('barber_shift_assignment_id')
              ->constrained('barber_shift_assignments')
              ->cascadeOnDelete();
        $table->date('date');
        $table->time('actual_checkin')->nullable();
        $table->enum('status', ['on_time', 'late', 'absent'])->default('absent');
        $table->unsignedInteger('late_minutes')->default(0);
        $table->timestamps();

        $table->unique(['barber_shift_assignment_id', 'date']);
    });
    }

    public function down(): void
    {
    Schema::dropIfExists('barber_attendances');
    }

};
