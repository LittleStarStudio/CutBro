<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barber_attendances', function (Blueprint $table) {
            $table->time('actual_checkout')->nullable()->after('actual_checkin');
        });
    }

    public function down(): void
    {
        Schema::table('barber_attendances', function (Blueprint $table) {
            $table->dropColumn('actual_checkout');
        });
    }

};
