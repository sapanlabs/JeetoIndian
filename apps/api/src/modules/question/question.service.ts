import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateQuestionDto {
  category: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  questionText: string;
  options: Array<{ optionKey: 'A' | 'B' | 'C' | 'D'; optionText: string; isCorrect: boolean }>;
  explanation?: string;
  sourceReference?: string;
  language?: string;
}

@Injectable()
export class QuestionService {
  constructor(private prisma: PrismaService) {}

  async createQuestion(creatorId: string, dto: CreateQuestionDto) {
    // Validate that exactly 1 option is correct
    const correctCount = dto.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new BadRequestException('A question must have exactly one correct option.');
    }

    return this.prisma.question.create({
      data: {
        category: dto.category,
        difficulty: dto.difficulty || 'MEDIUM',
        status: 'DRAFT',
        currentVersion: 1,
        creatorId,
        versions: {
          create: {
            version: 1,
            questionText: dto.questionText,
            explanation: dto.explanation,
            sourceReference: dto.sourceReference,
            language: dto.language || 'en',
            options: {
              create: dto.options.map((opt) => ({
                optionKey: opt.optionKey,
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
              })),
            },
          },
        },
      },
      include: {
        versions: {
          include: { options: true },
        },
      },
    });
  }

  async updateQuestionVersion(questionId: string, reviewerId: string, dto: CreateQuestionDto) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { versions: true },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // IMMUTABILITY RULE: If published or used, increment version instead of mutating in place
    const newVersion = question.currentVersion + 1;

    const createdVersion = await this.prisma.questionVersion.create({
      data: {
        questionId: question.id,
        version: newVersion,
        questionText: dto.questionText,
        explanation: dto.explanation,
        sourceReference: dto.sourceReference,
        language: dto.language || 'en',
        options: {
          create: dto.options.map((opt) => ({
            optionKey: opt.optionKey,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          })),
        },
      },
      include: { options: true },
    });

    await this.prisma.question.update({
      where: { id: questionId },
      data: {
        currentVersion: newVersion,
        reviewerId,
        status: 'APPROVED',
      },
    });

    return createdVersion;
  }

  async listQuestions(category?: string, status?: any) {
    return this.prisma.question.findMany({
      where: {
        ...(category && { category }),
        ...(status && { status }),
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          include: { options: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
