declare class ScheduleEmailService {
    private isRunning;
    constructor();
    startScheduler(): void;
    checkAllUsersDeadlines(): Promise<void>;
    sendDailySummary(): Promise<void>;
    private getUserScheduleItems;
    private findUrgentDeadlines;
    private getTodayDeadlines;
    private getWeekDeadlines;
    private sendDailySummaryEmail;
    triggerManualCheck(): Promise<void>;
    stopScheduler(): void;
}
export declare const scheduleEmailService: ScheduleEmailService;
export default ScheduleEmailService;
//# sourceMappingURL=scheduleEmailService.d.ts.map