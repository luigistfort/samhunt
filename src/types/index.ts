// src/types/index.ts

// ─── SAM.gov API Types ────────────────────────────────────────────────────────

export interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  fullParentPathName?: string; // e.g. "DEPT OF DEFENSE.ARMY"
  fullParentPathCode?: string;
  postedDate: string;
  type: string; // "Solicitation", "Sources Sought", etc.
  baseType?: string;
  archiveType?: string;
  archiveDate?: string;
  typeOfSetAsideDescription?: string;
  typeOfSetAside?: string;
  responseDeadLine?: string;
  naicsCode?: string;
  naicsHierarchyCode?: string;
  classificationCode?: string;
  active: string; // "Yes" | "No"
  award?: {
    date?: string;
    number?: string;
    amount?: string;
    awardee?: {
      name?: string;
      location?: {
        streetAddress?: string;
        city?: { code?: string; name?: string };
        state?: { code?: string; name?: string };
        zip?: string;
        country?: { code?: string; name?: string };
      };
      ueiSAM?: string;
    };
  };
  pointOfContact?: Array<{
    fax?: string;
    type?: string;
    email?: string;
    phone?: string;
    title?: string;
    fullName?: string;
  }>;
  description?: string;
  organizationHierarchy?: Array<{
    name?: string;
    code?: string;
    level?: string;
  }>;
  officeAddress?: {
    zipcode?: string;
    city?: string;
    countryCode?: string;
    state?: string;
  };
  placeOfPerformance?: {
    streetAddress?: string;
    city?: { code?: string; name?: string };
    state?: { code?: string; name?: string };
    zip?: string;
    country?: { code?: string; name?: string };
  };
  additionalInfoLink?: string;
  uiLink?: string; // The SAM.gov detail URL
  links?: Array<{
    rel?: string;
    href?: string;
    hreflang?: string;
    media?: string;
    title?: string;
    type?: string;
    deprecation?: string;
  }>;
  resourceLinks?: string[];
  organizationType?: string;
  state?: string;
  city?: string;
}

export interface SamSearchResponse {
  totalRecords: number;
  limit: number;
  offset: number;
  opportunitiesData: SamOpportunity[];
  links?: Array<{ rel: string; href: string }>;
}

// ─── Search Filter Types ──────────────────────────────────────────────────────

export type NoticeType =
  | 'Solicitation'
  | 'Presolicitation'
  | 'Sources Sought'
  | 'Award Notice'
  | 'Justification'
  | 'Intent to Bundle Requirements'
  | 'Fair Opportunity / Limited Sources Justification'
  | 'Special Notice'
  | 'Sale of Surplus Property'
  | 'Combined Synopsis/Solicitation';

export type SetAsideType =
  | 'SBA'       // Small Business
  | 'SBP'       // Small Business Set-Aside (Partial)
  | '8A'        // 8(a) Sole Source
  | '8AN'       // 8(a) Competitive
  | 'HZC'       // HUBZone Set-Aside
  | 'HZS'       // HUBZone Sole Source
  | 'SDVOSBS'   // SDVOSB Sole Source
  | 'SDVOSBC'   // SDVOSB Competitive
  | 'WOSB'      // WOSB
  | 'WOSBSS'    // WOSB Sole Source
  | 'EDWOSB'    // Economically Disadvantaged WOSB
  | 'EDWOSBSS'  // EDWOSB Sole Source
  | 'LAS'       // Local Area Set-Aside
  | 'IEE'       // Indian Economic Enterprise
  | 'ISBEE'     // Indian Small Business Economic Enterprise
  | 'BICiv'     // Buy Indian
  | 'VSA'       // Very Small Business
  | 'VSB';      // Veteran-Owned Small Business

export type SortOption = 'postedDate' | 'responseDeadLine' | 'relevance';
export type SortOrder = 'asc' | 'desc';

export interface SearchParams {
  // Text search
  keyword?: string;
  solicitationNumber?: string;

  // Filters
  noticeType?: string[];
  postedFrom?: string;   // ISO date string
  postedTo?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
  naicsCodes?: string[];
  setAsideTypes?: string[];
  state?: string;
  zip?: string;
  radiusMiles?: number;
  organizationId?: string;

  // Quick filters
  newThisWeek?: boolean;
  closingSoon?: boolean; // within 7 days
  smallBusinessSetAside?: boolean;

  // Sorting
  sortBy?: SortOption;
  sortOrder?: SortOrder;

  // Pagination
  page?: number;
  limit?: number;
}

export interface NormalizedSearchParams {
  keyword?: string;
  solicitationNumber?: string;
  noticeType?: string;
  postedFrom?: string;
  postedTo?: string;
  responseDeadLineFrom?: string;
  responseDeadLineTo?: string;
  naicsCode?: string;
  typeOfSetAside?: string;
  state?: string;
  zip?: string;
  organizationId?: string;
  sortBy?: string;
  limit: number;
  offset: number;
}

// ─── Enriched Opportunity (our internal model) ────────────────────────────────

export interface EnrichedOpportunity extends SamOpportunity {
  daysUntilDeadline?: number;
  urgencyLevel?: 'critical' | 'urgent' | 'normal' | 'low' | 'closed';
  agencyName?: string;
  setAsideLabel?: string;
  samUrl: string;
}

// ─── Business Profile ─────────────────────────────────────────────────────────

export interface BusinessProfile {
  id: string;
  companyName?: string;
  uei?: string;
  description?: string;
  naicsCodes: string[];
  certifications: string[];
  preferredStates: string[];
  homeZip?: string;
  targetAgencies: string[];
  minContractSize?: number;
  maxContractSize?: number;
  allowRemote: boolean;
  preferredNoticeTypes: string[];
}

// ─── AI Types ─────────────────────────────────────────────────────────────────

export interface AIOpportunitySummary {
  summary: string;
  keyRequirements: string[];
  risks: string[];
  fitScore?: number;      // 0-100
  fitReasons?: string[];
  nextSteps: string[];
  estimatedValue?: string;
}

// ─── Saved Search / Favorites ─────────────────────────────────────────────────

export interface SavedSearch {
  id: string;
  name: string;
  query: SearchParams;
  notifyEmail: boolean;
  lastRunAt?: string;
  resultCount?: number;
  createdAt: string;
}

export interface FavoriteOpportunity {
  id: string;
  noticeId: string;
  solicitationNumber?: string;
  title: string;
  agencyName?: string;
  noticeType?: string;
  postedDate?: string;
  responseDeadLine?: string;
  naicsCode?: string;
  setAside?: string;
  placeOfPerformance?: string;
  samUrl: string;
  notes?: string;
  fitScore?: number;
  aiSummary?: string;
  createdAt: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Smart Search Parse Result ────────────────────────────────────────────────

export interface SmartSearchResult {
  params: SearchParams;
  explanation: string;
  confidence: number;
}
