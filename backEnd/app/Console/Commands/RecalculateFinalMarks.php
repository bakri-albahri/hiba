<?php

namespace App\Console\Commands;

use App\Models\StudentCourseGrade;
use Illuminate\Console\Command;

class RecalculateFinalMarks extends Command
{
    protected $signature = 'grades:recalculate-final-marks {--dry-run : Show changes without saving them}';

    protected $description = 'Recalculate all final marks using the formula: coursework * 20% + practical * 20% + exam * 60%.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $updated = 0;
        $checked = 0;

        StudentCourseGrade::query()
            ->orderBy('id')
            ->chunkById(200, function ($grades) use ($dryRun, &$updated, &$checked) {
                foreach ($grades as $grade) {
                    $checked++;

                    $oldFinal = $grade->final_mark;
                    $newFinal = StudentCourseGrade::calculateFinalMark(
                        $grade->coursework_mark,
                        $grade->practical_mark,
                        $grade->exam_mark
                    );

                    if ((string) $oldFinal === (string) $newFinal) {
                        continue;
                    }

                    $updated++;

                    $this->line(
                        "Grade #{$grade->id}: {$oldFinal} => " . ($newFinal ?? 'NULL')
                        . " | coursework={$grade->coursework_mark}, practical={$grade->practical_mark}, exam={$grade->exam_mark}"
                    );

                    if (!$dryRun) {
                        $grade->forceFill([
                            'final_mark' => $newFinal,
                            'last_updated_at' => $newFinal !== null ? now() : $grade->last_updated_at,
                        ])->saveQuietly();
                    }
                }
            });

        $this->info("Checked {$checked} grade records.");

        if ($dryRun) {
            $this->warn("Dry run only. {$updated} grade records would be updated.");
        } else {
            $this->info("Done. {$updated} grade records were updated.");
        }

        return self::SUCCESS;
    }
}
