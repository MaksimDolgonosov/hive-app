import { LegalDocumentView } from '@/src/components/legal/LegalDocumentView';
import { getPrivacyPolicyDocument } from '@/legal/privacy-policy';

type PrivacyPolicyDocumentProps = {
  language: string;
  showTitle?: boolean;
};

export function PrivacyPolicyDocument({ language, showTitle = true }: PrivacyPolicyDocumentProps) {
  return <LegalDocumentView document={getPrivacyPolicyDocument(language)} showTitle={showTitle} />;
}
