import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// Dedicated Platform Super Admin Email
const PLATFORM_SUPER_ADMIN_EMAIL = 'larteyprince132@gmail.com';

// In-memory platform store for administrative management & synchronization
interface PlatformStore {
  businesses: any[];
  users: any[];
  auditLogs: any[];
  settings: {
    platformName: string;
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
    defaultCurrency: string;
    supportEmail: string;
    updatedAt: string;
  };
}

const platformStore: PlatformStore = {
  businesses: [],
  users: [],
  auditLogs: [
    {
      id: 'log-sys-init',
      action: 'PLATFORM_INITIALIZED',
      details: 'KASA OS Super Admin engine initialized with zero default businesses.',
      adminEmail: PLATFORM_SUPER_ADMIN_EMAIL,
      adminUid: 'platform-owner',
      timestamp: new Date().toISOString(),
    },
  ],
  settings: {
    platformName: 'KASA OS Multi-Tenant Platform',
    maintenanceMode: false,
    allowNewRegistrations: true,
    defaultCurrency: 'GHS',
    supportEmail: 'support@kasaos.com',
    updatedAt: new Date().toISOString(),
  },
};

// Initialize GoogleGenAI SDK on server-side
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'KASA OS Business Engine & Super Admin Portal',
    version: '2.0.0',
    platformOwner: PLATFORM_SUPER_ADMIN_EMAIL,
    hasGeminiKey: Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY'),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Middleware: Verify Super Admin Access on Backend
 */
function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminEmail = (req.headers['x-admin-email'] as string) || req.body?.adminEmail || (req.query?.adminEmail as string);

  if (!adminEmail || adminEmail.toLowerCase().trim() !== PLATFORM_SUPER_ADMIN_EMAIL.toLowerCase().trim()) {
    res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'Administrative privileges required. Only the platform owner can access this resource.',
    });
    return;
  }
  next();
}

/**
 * Super Admin Endpoint: Verify Super Admin Status
 */
app.post('/api/admin/verify', (req: Request, res: Response) => {
  const { email } = req.body;
  const isSuperAdmin = Boolean(
    email && email.toLowerCase().trim() === PLATFORM_SUPER_ADMIN_EMAIL.toLowerCase().trim()
  );

  res.json({
    isSuperAdmin,
    email: email || null,
    superAdminEmail: PLATFORM_SUPER_ADMIN_EMAIL,
  });
});

/**
 * Sync endpoint: Businesses register or report state to platform registry
 */
app.post('/api/platform/sync-business', (req: Request, res: Response) => {
  try {
    const business = req.body;
    if (!business || !business.id) {
      res.status(400).json({ error: 'Valid business record is required' });
      return;
    }

    const existingIndex = platformStore.businesses.findIndex((b) => b.id === business.id);
    if (existingIndex >= 0) {
      platformStore.businesses[existingIndex] = {
        ...platformStore.businesses[existingIndex],
        ...business,
        updatedAt: new Date().toISOString(),
      };
    } else {
      platformStore.businesses.unshift({
        ...business,
        status: business.status || 'active',
        createdAt: business.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Log registration to audit logs
      platformStore.auditLogs.unshift({
        id: `log-reg-${Date.now()}`,
        action: 'BUSINESS_REGISTERED',
        details: `New business "${business.name}" registered in industry "${business.industry}".`,
        adminEmail: 'system',
        adminUid: 'system',
        targetBusinessId: business.id,
        targetBusinessName: business.name,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true, count: platformStore.businesses.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync business' });
  }
});

/**
 * Sync endpoint: User registration report
 */
app.post('/api/platform/sync-user', (req: Request, res: Response) => {
  try {
    const user = req.body;
    if (!user || !user.uid) {
      res.status(400).json({ error: 'Valid user record is required' });
      return;
    }

    const existingIndex = platformStore.users.findIndex((u) => u.uid === user.uid);
    if (existingIndex >= 0) {
      platformStore.users[existingIndex] = {
        ...platformStore.users[existingIndex],
        ...user,
      };
    } else {
      platformStore.users.unshift({
        ...user,
        status: user.status || 'active',
        createdAt: user.createdAt || new Date().toISOString(),
      });
    }

    res.json({ success: true, count: platformStore.users.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

/**
 * Super Admin: Platform Overview
 */
app.get('/api/admin/overview', requireSuperAdmin, (_req: Request, res: Response) => {
  const totalBusinesses = platformStore.businesses.length;
  const activeBusinesses = platformStore.businesses.filter((b) => b.status === 'active').length;
  const suspendedBusinesses = platformStore.businesses.filter((b) => b.status === 'suspended').length;
  const totalUsers = platformStore.users.length;

  const industryCounts: Record<string, number> = {};
  platformStore.businesses.forEach((b) => {
    const ind = b.industry || 'other';
    industryCounts[ind] = (industryCounts[ind] || 0) + 1;
  });

  res.json({
    totalBusinesses,
    activeBusinesses,
    suspendedBusinesses,
    totalUsers,
    recentRegistrations: platformStore.businesses.slice(0, 5),
    recentActivity: platformStore.auditLogs.slice(0, 10),
    industryCounts,
    settings: platformStore.settings,
  });
});

/**
 * Super Admin: Business Directory (Search, Filter, Sort)
 */
app.get('/api/admin/businesses', requireSuperAdmin, (req: Request, res: Response) => {
  const { search, industry, status, sort } = req.query;

  let results = [...platformStore.businesses];

  if (search && typeof search === 'string') {
    const term = search.toLowerCase();
    results = results.filter(
      (b) =>
        b.name?.toLowerCase().includes(term) ||
        b.email?.toLowerCase().includes(term) ||
        b.ownerEmail?.toLowerCase().includes(term) ||
        b.id?.toLowerCase().includes(term)
    );
  }

  if (industry && typeof industry === 'string' && industry !== 'all') {
    results = results.filter((b) => b.industry === industry);
  }

  if (status && typeof status === 'string' && status !== 'all') {
    results = results.filter((b) => b.status === status);
  }

  if (sort === 'oldest') {
    results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === 'name') {
    results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    // Newest first default
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ businesses: results, total: results.length });
});

/**
 * Super Admin: Business Status Management (Activate / Suspend / Reactivate)
 */
app.post('/api/admin/business/status', requireSuperAdmin, (req: Request, res: Response) => {
  const { businessId, status, adminEmail, reason } = req.body;

  if (!businessId || !['active', 'suspended'].includes(status)) {
    res.status(400).json({ error: 'Valid businessId and status ("active" | "suspended") are required' });
    return;
  }

  const business = platformStore.businesses.find((b) => b.id === businessId);
  if (!business) {
    res.status(404).json({ error: 'Business not found' });
    return;
  }

  const previousStatus = business.status;
  business.status = status;
  business.updatedAt = new Date().toISOString();

  // Record administrative action in audit log
  const auditEntry = {
    id: `log-admin-${Date.now()}`,
    action: status === 'active' ? 'BUSINESS_ACTIVATED' : 'BUSINESS_SUSPENDED',
    details: `Business "${business.name}" status changed from ${previousStatus} to ${status}. Reason: ${reason || 'Administrative action'}`,
    adminEmail: adminEmail || PLATFORM_SUPER_ADMIN_EMAIL,
    adminUid: 'super-admin-uid',
    targetBusinessId: business.id,
    targetBusinessName: business.name,
    timestamp: new Date().toISOString(),
  };

  platformStore.auditLogs.unshift(auditEntry);

  res.json({
    success: true,
    business,
    auditLog: auditEntry,
  });
});

/**
 * Super Admin: User Management
 */
app.get('/api/admin/users', requireSuperAdmin, (_req: Request, res: Response) => {
  res.json({ users: platformStore.users, total: platformStore.users.length });
});

app.post('/api/admin/user/status', requireSuperAdmin, (req: Request, res: Response) => {
  const { uid, status, adminEmail } = req.body;

  const user = platformStore.users.find((u) => u.uid === uid);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  user.status = status;
  platformStore.auditLogs.unshift({
    id: `log-user-${Date.now()}`,
    action: `USER_${status.toUpperCase()}`,
    details: `User "${user.email}" account status updated to ${status}.`,
    adminEmail: adminEmail || PLATFORM_SUPER_ADMIN_EMAIL,
    adminUid: 'super-admin-uid',
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, user });
});

/**
 * Super Admin: Platform Analytics
 */
app.get('/api/admin/analytics', requireSuperAdmin, (_req: Request, res: Response) => {
  const industries = [
    'retail',
    'wholesale',
    'manufacturing',
    'agriculture',
    'hospitality',
    'services',
    'construction',
    'automotive',
    'ecommerce',
    'other',
  ];

  const industryDistribution = industries.map((ind) => ({
    industry: ind,
    count: platformStore.businesses.filter((b) => b.industry === ind).length,
  }));

  const activeCount = platformStore.businesses.filter((b) => b.status === 'active').length;
  const suspendedCount = platformStore.businesses.filter((b) => b.status === 'suspended').length;

  res.json({
    industryDistribution,
    statusBreakdown: [
      { name: 'Active', value: activeCount },
      { name: 'Suspended', value: suspendedCount },
    ],
    totalBusinesses: platformStore.businesses.length,
    totalUsers: platformStore.users.length,
  });
});

/**
 * Super Admin: Audit Logs
 */
app.get('/api/admin/audit-logs', requireSuperAdmin, (_req: Request, res: Response) => {
  res.json({ logs: platformStore.auditLogs, total: platformStore.auditLogs.length });
});

/**
 * Super Admin: Platform Settings
 */
app.get('/api/admin/settings', requireSuperAdmin, (_req: Request, res: Response) => {
  res.json({ settings: platformStore.settings });
});

app.post('/api/admin/settings', requireSuperAdmin, (req: Request, res: Response) => {
  const { platformName, maintenanceMode, allowNewRegistrations, defaultCurrency, supportEmail, adminEmail } = req.body;

  platformStore.settings = {
    ...platformStore.settings,
    platformName: platformName ?? platformStore.settings.platformName,
    maintenanceMode: typeof maintenanceMode === 'boolean' ? maintenanceMode : platformStore.settings.maintenanceMode,
    allowNewRegistrations:
      typeof allowNewRegistrations === 'boolean' ? allowNewRegistrations : platformStore.settings.allowNewRegistrations,
    defaultCurrency: defaultCurrency ?? platformStore.settings.defaultCurrency,
    supportEmail: supportEmail ?? platformStore.settings.supportEmail,
    updatedAt: new Date().toISOString(),
  };

  platformStore.auditLogs.unshift({
    id: `log-set-${Date.now()}`,
    action: 'SETTINGS_UPDATED',
    details: `Platform settings updated by ${adminEmail || PLATFORM_SUPER_ADMIN_EMAIL}.`,
    adminEmail: adminEmail || PLATFORM_SUPER_ADMIN_EMAIL,
    adminUid: 'super-admin-uid',
    timestamp: new Date().toISOString(),
  });

  res.json({ success: true, settings: platformStore.settings });
});

/**
 * AI Business Intelligence Chat Endpoint
 */
app.post('/api/gemini/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, businessContext } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const businessName = businessContext?.name || 'Business Workspace';
    const currency = businessContext?.currencySymbol || 'GH₵';
    const metrics = businessContext?.metrics || {};

    const hasNoData = (metrics.salesCount || 0) === 0 && (metrics.inventoryCount || 0) === 0;

    if (hasNoData) {
      res.json({
        reply: `### Welcome to ${businessName} Intelligence!
Your workspace is completely new and ready for records. To begin:
1. **Add your catalog products** in the Inventory section so you can track stock.
2. **Record your first sale** to generate invoices and start tracking cash flow.
3. **Log operational expenses** (such as rent or utilities) to monitor your profit and overheads.

Once you record transactions, I will analyze your gross margins, cash collection velocity, customer receivables, and stock reorder levels.`,
        grounded: true,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.json({
        reply: `### Financial Overview for ${businessName}
• **Total Sales:** ${currency}${metrics.totalSales?.toLocaleString()} (${metrics.salesCount || 0} sales recorded)
• **Cash Inflows:** ${currency}${metrics.cashInflows?.toLocaleString()}
• **Outstanding Receivables:** ${currency}${metrics.outstandingReceivables?.toLocaleString()}
• **Operating Expenses:** ${currency}${metrics.totalExpenses?.toLocaleString()}
• **Net Profit:** ${currency}${metrics.netProfit?.toLocaleString()}

You can ask me to analyze profit margins, low stock alerts, or credit collection strategies.`,
        grounded: true,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const systemInstruction = `You are KASA Intelligence, the expert AI CFO and business operations co-pilot for KASA OS.
You are advising the management of "${businessName}".
Currency: ${currency}.
Strictly ground answers in these business records:
- Total Sales: ${currency}${metrics.totalSales ?? 0}
- Cash Collected: ${currency}${metrics.cashInflows ?? 0}
- Customer Receivables: ${currency}${metrics.outstandingReceivables ?? 0}
- Total Expenses: ${currency}${metrics.totalExpenses ?? 0}
- Gross Profit: ${currency}${metrics.grossProfit ?? 0}
- Net Profit: ${currency}${metrics.netProfit ?? 0}
- Inventory Value: ${currency}${metrics.inventoryValue ?? 0}
- Total Catalog Items: ${metrics.inventoryCount ?? 0}
Be concise, practical, and helpful for SME operations.`;

    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: message,
          config: { systemInstruction },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000)),
      ]);

      res.json({
        reply: (response as any).text ?? 'No response generated.',
        grounded: true,
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.json({
        reply: `### Executive Financial Brief for ${businessName}
• **Total Sales:** ${currency}${metrics.totalSales?.toLocaleString()}
• **Cash Collected:** ${currency}${metrics.cashInflows?.toLocaleString()}
• **Outstanding Receivables:** ${currency}${metrics.outstandingReceivables?.toLocaleString()}
• **Operating Expenses:** ${currency}${metrics.totalExpenses?.toLocaleString()}
• **Net Profit:** ${currency}${metrics.netProfit?.toLocaleString()}

Ask me anything about profitability, working capital, or expense reduction.`,
        grounded: true,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// Configure Vite in dev or static in prod
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KASA OS] Multi-Tenant Platform & Super Admin listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start KASA OS Server:', err);
  process.exit(1);
});
