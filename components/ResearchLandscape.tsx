import { buildResearchLandscape } from "@/lib/research-landscape";
import type { ThesisProject } from "@/lib/thesis-types";

interface ResearchLandscapeProps {
  project: ThesisProject;
}

export function ResearchLandscape({ project }: ResearchLandscapeProps) {
  const landscape = buildResearchLandscape(project);
  const topicMatches = landscape.matches.filter((match) => match.matchedTerms.length > 0);

  return (
    <section className="panel research-landscape" aria-labelledby="landscape-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">TOPIC MAP</p>
          <h2 id="landscape-heading">Wider research perspective</h2>
        </div>
        <span className="status-pill">{landscape.verifiedMatchCount} verified match{landscape.verifiedMatchCount === 1 ? "" : "es"}</span>
      </div>
      <p className="review-intro">
        The map is built only from the topic, brief, and records in this local library. A relevance score is a keyword overlap aid, not a judgment about scholarly quality or a citation recommendation.
      </p>
      <div className="topic-terms" aria-label="Topic terms">
        {landscape.topicTerms.length === 0 ? <span>Enter a more specific topic or research question.</span> : landscape.topicTerms.map((term) => <span key={term}>{term}</span>)}
      </div>

      <div className="landscape-section">
        <h3>Most aligned prior works</h3>
        {topicMatches.length === 0 ? (
          <p className="field-note">No topic match yet. Add richer notes from the earlier work; a title alone is not enough for synthesis.</p>
        ) : (
          <ul className="landscape-list">
            {topicMatches.slice(0, 5).map((match) => (
              <li key={match.record.id}>
                <strong>{match.record.id} · {match.relevance}% overlap · {match.record.status}</strong>
                <span>{match.record.title}</span>
                <small>Matched: {match.matchedTerms.join(", ")}</small>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="landscape-section">
        <h3>Candidate gap signals</h3>
        {landscape.candidateGaps.length === 0 ? (
          <p className="field-note">No stated limitation has been recorded. Do not manufacture a gap; add limitations from the original works first.</p>
        ) : (
          <ul className="landscape-list">
            {landscape.candidateGaps.map((gap) => <li key={gap.recordId}><strong>{gap.recordId}</strong><span>{gap.text}</span></li>)}
          </ul>
        )}
      </div>

      <div className="landscape-section">
        <h3>Responsible synthesis prompts</h3>
        <ul className="synthesis-prompts">
          {landscape.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
        </ul>
      </div>
    </section>
  );
}
