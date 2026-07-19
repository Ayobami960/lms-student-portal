import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { aiConfig } from "../config/ai.js";
import { logger } from "../utils/logger.js";

interface ChatContext {
  courseTitle?: string;
}

// ---- AI Provider abstraction -------------------------------------------
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

const realProvider: AIProvider = {
  async generateReply() {
    // FIXED: Used 'new' keyword constructor instantiator
    throw new ApiError(500, "AI provider not configured. Set AI_PROVIDER and AI_API_KEY, or use the mock provider.");
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

    // FIXED: Used 'new' keyword constructor instantiator
    if (conversation && conversation.userId !== userId) {
      throw new ApiError(403, "This conversation does not belong to you");
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

    
    const chatContext: ChatContext = {};
    if (courseTitle) {
      chatContext.courseTitle = courseTitle;
    }

    let replyText: string;
    try {
      replyText = await getProvider().generateReply(
        history.map((h: any) => ({ role: h.role, content: h.content })),
        chatContext // Handed over sanitized context mapping object
      );
    } catch (err) {
      logger.error({ err }, "AI provider failure");
      throw err instanceof ApiError ? err : new ApiError(500, "The AI assistant is temporarily unavailable");
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
    
    
    if (!conversation) throw new ApiError(404, "Conversation not found");
    if (conversation.userId !== userId) throw new ApiError(403, "Forbidden");
    return conversation;
  },

  async deleteConversation(id: string, userId: string) {
    const conversation = await prisma.aIConversation.findUnique({ where: { id } });
    
    
    if (!conversation) throw new ApiError(404, "Conversation not found");
    if (conversation.userId !== userId) throw new ApiError(403, "Forbidden");
    await prisma.aIConversation.delete({ where: { id } });
  },
};
