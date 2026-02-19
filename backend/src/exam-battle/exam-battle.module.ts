import { Module } from '@nestjs/common';
import { ExamBattleController } from './exam-battle.controller';
import { ExamBattleService } from './exam-battle.service';

@Module({
    controllers: [ExamBattleController],
    providers: [ExamBattleService],
    exports: [ExamBattleService],
})
export class ExamBattleModule { }
