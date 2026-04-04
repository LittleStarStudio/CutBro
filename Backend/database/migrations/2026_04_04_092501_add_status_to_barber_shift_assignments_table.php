<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('barber_shift_assignments', function (Blueprint $table) {
            $table->enum('status', ['active', 'off', 'leave'])->default('active')->after('day_of_week');
        });
    }

    public function down(): void
    {
        Schema::table('barber_shift_assignments', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
