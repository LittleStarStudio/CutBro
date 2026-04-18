<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('owner_subscriptions', function (Blueprint $table) {
            $table->string('payment_channel')->nullable()->after('midtrans_snap_token');
        });
    }

    public function down(): void
    {
        Schema::table('owner_subscriptions', function (Blueprint $table) {
            $table->dropColumn('payment_channel');
        });
    }

};
