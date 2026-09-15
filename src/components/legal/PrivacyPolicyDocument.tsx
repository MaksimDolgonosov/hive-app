import { Text, View } from 'react-native';

import {
  getPrivacyPolicyDocument,
  type PrivacyBlock,
  type PrivacySection,
} from '@/legal/privacy-policy';

type PrivacyPolicyDocumentProps = {
  language: string;
  showTitle?: boolean;
};

function PrivacyBlockView({ block }: { block: PrivacyBlock }) {
  if (block.type === 'paragraph') {
    return (
      <Text className="font-inter text-[15px] leading-[22px] text-hive-muted">{block.text}</Text>
    );
  }

  return (
    <View className="gap-2">
      {block.items.map((item) => (
        <View key={item} className="flex-row gap-2">
          <Text className="font-inter text-[15px] leading-[22px] text-hive-primary">•</Text>
          <Text className="flex-1 font-inter text-[15px] leading-[22px] text-hive-muted">
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

function PrivacySectionView({ section }: { section: PrivacySection }) {
  return (
    <View className="gap-3">
      <Text className="font-display text-[20px] font-bold leading-[26px] text-hive-foreground">
        {section.heading}
      </Text>
      {section.blocks.map((block, index) => (
        <PrivacyBlockView
          key={block.type === 'paragraph' ? block.text.slice(0, 48) : `list-${index}`}
          block={block}
        />
      ))}
    </View>
  );
}

export function PrivacyPolicyDocument({ language, showTitle = true }: PrivacyPolicyDocumentProps) {
  const document = getPrivacyPolicyDocument(language);

  return (
    <View className="gap-6">
      <View className="gap-3">
        {showTitle ? (
          <Text className="font-display text-[32px] font-bold leading-[38px] text-hive-foreground">
            {document.title}
          </Text>
        ) : null}
        <Text className="font-inter text-[15px] leading-[22px] text-hive-muted">
          {document.intro}
        </Text>
      </View>

      {document.sections.map((section) => (
        <PrivacySectionView key={section.heading} section={section} />
      ))}
    </View>
  );
}
