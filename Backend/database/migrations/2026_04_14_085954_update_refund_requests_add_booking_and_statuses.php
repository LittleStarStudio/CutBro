<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('refund_requests', function (Blueprint $table) {
            $table->foreignId('booking_id')
                  ->nullable()
                  ->after('payment_id')
                  ->constrained('bookings')
                  ->nullOnDelete();
        });

        DB::statement("ALTER TABLE refund_requests MODIFY COLUMN status ENUM('owner_pending','owner_rejected','pending','approved','rejected') DEFAULT 'pending'");
    }

    public function down(): void
    {
        Schema::table('refund_requests', function (Blueprint $table) {
            $table->dropForeign(['booking_id']);
            $table->dropColumn('booking_id');
        });
        DB::statement("ALTER TABLE refund_requests MODIFY COLUMN status ENUM('pending','approved','rejected') DEFAULT 'pending'");
    }
};