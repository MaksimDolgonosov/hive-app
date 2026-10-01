import { Text, View } from 'react-native';

import type { LegalBlock, LegalDocument, LegalSection } from '@/legal/document';

type LegalDocumentViewProps = {
  document: LegalDocument;
  showTitle?: boolean;
};

function LegalBlockView({ block }: { block: LegalBlock }) {
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

function LegalSectionView({ section }: { section: LegalSection }) {
  return (
    <View className="gap-3">
      <Text className="font-display text-[20px] font-bold leading-[26px] text-hive-foreground">
        {section.heading}
      </Text>
      {section.blocks.map((block, index) => (
        <LegalBlockView
          key={block.type === 'paragraph' ? block.text.slice(0, 48) : `list-${index}`}
          block={block}
        />
      ))}
    </View>
  );
}

export function LegalDocumentView({ document, showTitle = true }: LegalDocumentViewProps) {
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
        <LegalSectionView key={section.heading} section={section} />
      ))}
    </View>
  );
}
