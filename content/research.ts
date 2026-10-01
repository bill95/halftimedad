/**
 * The research page.
 *
 * One file feeds /research and anything else that quotes a finding (the
 * homepage proof strip, tool pages, Sunday Reset). Correct a number here and it
 * is corrected everywhere.
 *
 * Rules for editing:
 * - Say "linked to", not "causes". Only the two randomized trials (mediation,
 *   fathers' programs) support causal language.
 * - Never add a number you have not seen in the paper itself.
 * - Link the journal, PubMed, government or university page, never a blog
 *   summarizing it. Leave `url` out until the primary link is confirmed.
 * - This page is about being a better dad in the time you have. It is not an
 *   argument about custody.
 */

export type Citation = {
  text: string;
  url?: string;
};

export type Finding = {
  slug: string;
  stat: string;
  headline: string;
  summary: string;
  caveat?: string;
  citations: Citation[];
};

export const RESEARCH_UPDATED = "October 2026";

export const FINDINGS: Finding[] = [
  {
    slug: "how-not-how-often",
    stat: "63 studies",
    headline: "How you parent matters more than how often.",
    summary:
      "A meta-analysis of 63 studies found that how often a nonresident father saw his children was not related to how they did in general. Feeling close to their dad, and a dad who was warm and kept steady rules, were linked to better school results and fewer emotional and behavior problems. A later review of 52 newer studies found the same pattern.",
    citations: [
      {
        text: "Amato, P. R. & Gilbreth, J. G. (1999). Nonresident fathers and children's well-being: A meta-analysis. Journal of Marriage and the Family, 61(3), 557 to 573.",
        url: "https://doi.org/10.2307/353560",
      },
      {
        text: "Adamsons, K. & Johnson, S. K. (2013). An updated and expanded meta-analysis of nonresident fathering and child well-being. Journal of Family Psychology.",
        url: "https://pubmed.ncbi.nlm.nih.gov/23978321",
      },
    ],
  },
  {
    slug: "conflict-is-the-harm",
    stat: "Conflict",
    headline: "Kids can handle two homes. Conflict between them is what hurts.",
    summary:
      "A review commissioned by the UK government found that frequent, intense and unresolved conflict between parents puts children's mental health at risk, from infancy into adulthood. It also found the link between parental conflict and harsher parenting may be stronger for fathers than for mothers.",
    caveat: "This is about destructive conflict that never gets resolved, not ordinary disagreement.",
    citations: [
      {
        text: "Harold, G., Acquah, D., Sellers, R. & Chowdry, H. (2016). What Works to Enhance Inter-Parental Relationships and Improve Outcomes for Children. Early Intervention Foundation for the UK Department for Work and Pensions.",
        url: "https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/509368/what-works-to-enhance-inter-parental-relationships.pdf",
      },
    ],
  },
  {
    slug: "skills-can-be-learned",
    stat: "384 fathers",
    headline: "Being a good dad after divorce is a skill. Skills can be learned.",
    summary:
      "In a randomized trial of 384 divorced and separated fathers, a parenting program improved how the fathers parented. Ten months later, their children had fewer emotional problems and better social skills. An earlier program for nonresident fathers, Dads for Life, also reduced children's emotional problems in a randomized trial.",
    caveat: "These are university programs, not HalfTimeDad. They show the kind of skills that make a difference.",
    citations: [
      {
        text: "New Beginnings Program for divorced and separated fathers, randomized trial (2018). Prevention Science.",
        url: "https://doi.org/10.1007/s11121-017-0841-x",
      },
      {
        text: "Braver, S. L., Griffin, W. A. & Cookston, J. T. (2005). Prevention programs for divorced nonresident fathers. Family Court Review, 43(1), 81 to 96.",
        url: "https://doi.org/10.1111/j.1744-1617.2005.00009.x",
      },
    ],
  },
  {
    slug: "mediation-twelve-years",
    stat: "12 years",
    headline: "How you settle it shapes the next twelve years.",
    summary:
      "High-conflict families contesting custody were randomly assigned to mediation or to court. Twelve years later, the parents who did not live with their children were more involved in their lives and had more say in coparenting if they had mediated, and conflict was no higher. Fathers who mediated were much more satisfied.",
    caveat: "Mediation is not appropriate where there is abuse or a safety concern.",
    citations: [
      {
        text: "Emery, R. E., Laumann-Billings, L., Waldron, M. C., Sbarra, D. A. & Dillon, P. (2001). Child custody mediation and litigation: Custody, contact, and coparenting 12 years after initial dispute resolution. Journal of Consulting and Clinical Psychology, 69(2), 323 to 332.",
        url: "https://pubmed.ncbi.nlm.nih.gov/11393609/",
      },
    ],
  },
  {
    slug: "overnights",
    stat: "Overnights",
    headline: "Bedtime, breakfast, the lost shoe. It all counts.",
    summary:
      "Young adults who had overnights with their father as infants or toddlers had better relationships with both their father and their mother at 18 to 20 than those who had none. Earlier work from the same lab found more time with dad helped protect children from the effects of conflict between their parents.",
    caveat: "These studies asked college students about their childhoods. Treat it as a strong pattern, not proof.",
    citations: [
      {
        text: "Fabricius, W. V. & Suh, G. W. (2017). Should infants and toddlers have frequent overnight parenting time with fathers? Psychology, Public Policy, and Law.",
        url: "https://news.asu.edu/20170202-discoveries-asu-study-overnights-dad-benefit-kids-divorce",
      },
      {
        text: "Fabricius, W. V. & Luecken, L. J. (2007). Postdivorce living arrangements, parent conflict, and long-term physical health correlates for children of divorce. Journal of Family Psychology, 21(2).",
      },
    ],
  },
  {
    slug: "two-homes",
    stat: "164,580 kids",
    headline: "Two homes can still be a good childhood.",
    summary:
      "A national survey of 12 and 15 year olds in Sweden found that children who lived about equally with both parents after a separation reported better wellbeing, family life and friendships than children who lived mostly or only with one parent. Children in intact families still scored highest.",
    citations: [
      {
        text: "Bergström, M. et al. (2013). Living in two homes: A Swedish national survey of wellbeing in 12 and 15 year olds with joint physical custody. BMC Public Health, 13, 868.",
        url: "https://doi.org/10.1186/1471-2458-13-868",
      },
    ],
  },
  {
    slug: "both-parents",
    stat: "Both parents",
    headline: "Kids tend to do well when both parents stay involved.",
    summary:
      "A meta-analysis found children in joint custody were better adjusted on average than children in sole custody, and similar to children in intact families on the measures studied. A later review of 60 studies found the same general pattern after accounting for family income and conflict.",
    caveat:
      "Most of this research can't rule out that families who choose shared arrangements already differed. It also does not apply where a parent is abusive or unsafe.",
    citations: [
      {
        text: "Bauserman, R. (2002). Child adjustment in joint-custody versus sole-custody arrangements: A meta-analytic review. Journal of Family Psychology, 16(1), 91 to 102.",
      },
      {
        text: "Nielsen, L. (2018). Joint versus sole physical custody: Outcomes for children independent of family income or parental conflict. Journal of Child Custody.",
        url: "https://doi.org/10.1080/15379418.2017.1422414",
      },
      {
        text: "Braver, S. L. & Votruba, A. M. (2018). Does joint physical custody \"cause\" children's better outcomes? Journal of Divorce & Remarriage, 59(5), 452 to 468.",
        url: "https://digitalcommons.unl.edu/psychfacpub/903",
      },
    ],
  },
  {
    slug: "the-bench",
    stat: "Loneliness",
    headline: "Nobody builds a support system for divorced dads.",
    summary:
      "In a US study of older adults, divorced men were lonelier than widowed men, and support from friends and family helped but did not close the gap. A Danish study found men who lived alone for more than six years, or went through two or more breakups, had higher levels of inflammation. Women did not show the same pattern.",
    citations: [
      {
        text: "Wright, M. R., Hammersmith, A. M., Brown, S. L., Lin, I-F. & Carr, D. (2020). The roles of marital dissolution and subsequent repartnering on loneliness in later life. Journals of Gerontology: Series B, 75(8), 1796 to 1807.",
        url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7489102",
      },
      {
        text: "University of Copenhagen (2022). Men's health more vulnerable after breakups, divorces, and living alone, than women's.",
        url: "https://healthsciences.ku.dk/newsfaculty-news/2022/01/when-men-get-divorced-or-live-alone-for-many-years-their-health-is-affected/",
      },
    ],
  },
];
