import { prisma } from "../config/db";
import { ApiError } from "../utils/ApiError";
import { aiConfig } from "../config/ai";
import { logger } from "../utils/logger";

interface ChatContext {
  courseTitle?: string;
}

// ---- AI Provider abstraction -------------------------------------------
// Real providers (Anthropic, OpenAI, etc.) can be added here behind the same
// `generateReply` interface. Falls back to a deterministic mock so the
// assistant works out of the box with no API key configured.
interface AIProvider {
  generateReply(history: { role: "USER" | "ASSISTANT"; content: string }[], context: ChatContext): Promise<string>;
}

const mockProvider: AIProvider = {
  async generateReply(history, context) {
    const lastMessage = history[history.length - 1]?.content.toLowerCase() ?? "";
    const courseNote = context.courseTitle ? ` in the context of "${context.courseTitle}"` : "";

    if (lastMessage.includes("quiz")) {
      return `Here's a short practice quiz${courseNote}:\n\n1. What is the main concept covered in the most recent lesson?\n2. Name one real-world application of this topic.\n3. What would happen if a key assumption were removed?\n\n(This is a mock response — connect a real AI provider via AI_PROVIDER/AI_API_KEY for tailored quizzes.)`;
    }
    if (lastMessage.includes("study plan")) {
      return `Here's a simple study plan${courseNote}:\n\n**Week 1:** Review fundamentals, complete first 2 lessons.\n**Week 2:** Practice with exercises, attempt the assignment.\n**Week 3:** Review feedback, revisit weak areas.\n**Week 4:** Final review and course assessment.\n\n(Mock response — connect a real AI provider for a plan personalized to your actual progress.)`;
    }
    if (lastMessage.includes("summar")) {
      return `Here's a summary${courseNote}: this module covers the core ideas step by step, building from foundational concepts toward practical application, with examples designed to reinforce each new idea before moving on.\n\n(Mock response — connect a real AI provider for a summary based on actual lesson content.)`;
    }
    return `Thanks for your question${courseNote}! I'm currently running in mock mode (no AI_API_KEY configured), so I can't give a fully tailored answer yet — but once a real provider is connected I'll be able to explain concepts, answer questions, and reference your actual course content directly.\n\nYou asked: "${history[history.length - 1]?.content}"`;
  },
};

// Placeholder for a real provider integration (e.g. Anthropic's Messages API).
// Left unimplemented intentionally — wire this up with your own API key.
const realProvider: AIProvider = {
  async generateReply() {
    throw ApiError.internal("AI provider not configured. Set AI_PROVIDER and AI_API_KEY, or use the mock provider.");
  },
};

function getProvider(): AIProvider {
  return aiConfig.isMock ? mockProvider : realProvider;
}

export const aiService = {
  async chat(userId: string, message: string, conversationId?: string, courseId?: string) {
    let conversation = conversationId
      ? await prisma.aIConversation.findUnique({ where: { id: conversationId } })
      : null;

    if (conversation && conversation.userId !== userId) {
      throw ApiError.forbidden("This conversation does not belong to you");
    }

    if (!conversation) {
      conversation = await prisma.aIConversation.create({
        data: { userId, title: message.slice(0, 60) },
      });
    }

    await prisma.aIMessage.create({
      data: { conversationId: conversation.id, role: "USER", content: message },
    });

    const history = await prisma.aIMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    let courseTitle: string | undefined;
    if (courseId) {
      const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
      courseTitle = course?.title;
    }

    let replyText: string;
    try {
      replyText = await getProvider().generateReply(
        history.map((h) => ({ role: h.role, content: h.content })),
        { courseTitle }
      );
    } catch (err) {
      logger.error({ err }, "AI provider failure");
      throw err instanceof ApiError ? err : ApiError.internal("The AI assistant is temporarily unavailable");
    }

    const reply = await prisma.aIMessage.create({
      data: { conversationId: conversation.id, role: "ASSISTANT", content: replyText },
    });

    return { conversation, reply };
  },

  async listConversations(userId: string) {
    return prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });
  },

  async getConversation(id: string, userId: string) {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (conversation.userId !== userId) throw ApiError.forbidden();
    return conversation;
  },

  async deleteConversation(id: string, userId: string) {
    const conversation = await prisma.aIConversation.findUnique({ where: { id } });
    if (!conversation) throw ApiError.notFound("Conversation not found");
    if (conversation.userId !== userId) throw ApiError.forbidden();
    await prisma.aIConversation.delete({ where: { id } });
  },
};
