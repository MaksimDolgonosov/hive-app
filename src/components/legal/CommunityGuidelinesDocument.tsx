import { LegalDocumentView } from '@/src/components/legal/LegalDocumentView';
import { getCommunityGuidelinesDocument } from '@/legal/community-guidelines';

type CommunityGuidelinesDocumentProps = {
  language: string;
  showTitle?: boolean;
};

export function CommunityGuidelinesDocument({
  language,
  showTitle = true,
}: CommunityGuidelinesDocumentProps) {
  return (
    <LegalDocumentView document={getCommunityGuidelinesDocument(language)} showTitle={showTitle} />
  );
}
