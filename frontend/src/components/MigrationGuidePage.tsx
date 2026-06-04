import { t } from "../i18n";
import type { MigrationRecommendation, ScanDetail } from "../lib/api";
import { AffectedFilesTable } from "./migrationGuide/AffectedFilesTable";
import { AiToolPanel } from "./migrationGuide/AiToolPanel";
import {
  getActionItems,
  getAffectedFindings,
  getDecisionText,
  getGuideKind,
  getHighestRiskLabel,
  getPrimaryLocation,
  getTopAlgorithms,
  getTransitionPath
} from "./migrationGuide/model";
import { RemediationConsole } from "./migrationGuide/RemediationConsole";
import { RemediationHeader } from "./migrationGuide/RemediationHeader";

type MigrationGuidePageProps = {
  recommendation: MigrationRecommendation;
  scan: ScanDetail;
  onBack: () => void;
  onOpenAlgorithmDocs: (target: string) => void;
  onSignInUnavailable: () => void;
};

export function MigrationGuidePage({ recommendation, scan, onBack, onOpenAlgorithmDocs, onSignInUnavailable }: MigrationGuidePageProps) {
  const kind = getGuideKind(recommendation);
  const affectedFindings = getAffectedFindings(scan.findings, kind);
  const actionItems = getActionItems(recommendation.recommendedAction);
  const transition = getTransitionPath(kind);

  return (
    <section className="remediation-page" aria-label={t("migrationGuide.ariaLabel")}>
      <RemediationHeader
        recommendation={recommendation}
        findingsCount={affectedFindings.length}
        highestRisk={getHighestRiskLabel(affectedFindings)}
        onBack={onBack}
      />
      <RemediationConsole
        recommendation={recommendation}
        actionItems={actionItems}
        decision={getDecisionText(kind)}
        inspectFirst={getPrimaryLocation(affectedFindings)}
        topAlgorithms={getTopAlgorithms(affectedFindings)}
        transition={transition}
        onOpenAlgorithmDocs={onOpenAlgorithmDocs}
      />
      <AiToolPanel target={transition.target} onSignInUnavailable={onSignInUnavailable} />
      <AffectedFilesTable
        findings={affectedFindings}
        repositoryUrl={scan.target}
        defaultBranch={scan.repositoryDefaultBranch}
      />
    </section>
  );
}
