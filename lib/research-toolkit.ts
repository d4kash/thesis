import { hasTopic } from "@/lib/topic-starter";
import type { ThesisProject } from "@/lib/thesis-types";

export interface ResearchToolkitResource {
  id: string;
  title: string;
  category: string;
  description: string;
  returnWith: string;
  href: string;
  linkLabel: string;
}

export interface ResearchToolkit {
  searchPhrase: string;
  resources: ResearchToolkitResource[];
}

const DEFAULT_RESEARCH_QUESTION = "What focused question will this project investigate?";
const MAX_SEARCH_PHRASE_LENGTH = 240;

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function buildResearchSearchPhrase(project: ThesisProject): string {
  if (!hasTopic(project)) return "";

  const title = compact(project.title);
  const researchQuestion = compact(project.researchQuestion);
  const question = researchQuestion && researchQuestion !== DEFAULT_RESEARCH_QUESTION
    ? researchQuestion
    : "";

  return compact([title, question].filter(Boolean).join(" ")).slice(0, MAX_SEARCH_PHRASE_LENGTH);
}

export function buildResearchToolkit(project: ThesisProject): ResearchToolkit {
  const searchPhrase = buildResearchSearchPhrase(project);
  const crossrefHref = searchPhrase
    ? `https://search.crossref.org/?q=${encodeURIComponent(searchPhrase)}`
    : "https://search.crossref.org/";

  return {
    searchPhrase,
    resources: [
      {
        id: "crossref",
        title: "Crossref Metadata Search",
        category: "Citation details",
        description: "Find bibliographic records by title, author, DOI, or ORCID; check the record against the original work.",
        returnWith: "A checked title, authors, year, DOI or stable URL, and where you read it.",
        href: crossrefHref,
        linkLabel: searchPhrase ? "Search this topic" : "Open Crossref",
      },
      {
        id: "openalex",
        title: "OpenAlex",
        category: "Research discovery",
        description: "Explore a free, open catalogue of research works, topics, institutions, and open-access locations.",
        returnWith: "Only the records you personally open and check; do not treat a search result as evidence by itself.",
        href: "https://openalex.org/",
        linkLabel: "Open OpenAlex",
      },
      {
        id: "doaj",
        title: "Directory of Open Access Journals",
        category: "Open-access reading",
        description: "Find peer-reviewed open-access journals and articles without bypassing publisher access controls.",
        returnWith: "A lawful full-text link, licence details when relevant, and a precise source locator.",
        href: "https://doaj.org/",
        linkLabel: "Open DOAJ",
      },
      {
        id: "shodhganga",
        title: "Shodhganga",
        category: "Indian thesis discovery",
        description: "Browse public Indian thesis records to understand research structure, methods, and stated limitations.",
        returnWith: "A stable record URL and your own checked comparison notes—not copied chapters or findings.",
        href: "https://shodhganga.inflibnet.ac.in/",
        linkLabel: "Open Shodhganga",
      },
      {
        id: "zotero",
        title: "Zotero",
        category: "Reference management",
        description: "Collect, organise, annotate, and cite the sources you have already checked throughout a long project.",
        returnWith: "A clean personal library whose individual records you still verify before citing.",
        href: "https://www.zotero.org/",
        linkLabel: "Get Zotero",
      },
      {
        id: "zoterobib",
        title: "ZoteroBib",
        category: "Quick bibliography",
        description: "Create a temporary bibliography from records or identifiers when you need a simple reference list.",
        returnWith: "A formatted draft bibliography to proofread against the original sources and your university style guide.",
        href: "https://zbib.org/",
        linkLabel: "Open ZoteroBib",
      },
    ],
  };
}
