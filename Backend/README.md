## After Deploy to VPS

Run this cron job:

* * * * * php /home/forge/cutbro/artisan schedule:run >> /dev/null 2>&1