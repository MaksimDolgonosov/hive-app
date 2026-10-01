export type LegalBlock = { type: 'paragraph'; text: string } | { type: 'list'; items: string[] };

export type LegalSection = {
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  title: string;
  intro: string;
  sections: LegalSection[];
};
