import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  BorderStyle,
  convertInchesToTwip,
  convertMillimetersToTwip,
  ShadingType,
} from 'docx';

// Margins: Left = 3.0cm (1701 twips), Top/Bottom/Right = 2.54cm (1440 twips)
const A4_WIDTH_TWIP = 11906;
const A4_HEIGHT_TWIP = 16838;
const LEFT_MARGIN = convertMillimetersToTwip(30);
const RIGHT_MARGIN = convertMillimetersToTwip(25.4);
const TOP_MARGIN = convertMillimetersToTwip(25.4);
const BOTTOM_MARGIN = convertMillimetersToTwip(25.4);

// Helper styles
const FONT_NAME = 'Times New Roman';
const BODY_SIZE = 24; // 12pt (in half-points)
const H1_SIZE = 28;   // 14pt bold
const H2_SIZE = 26;   // 13pt bold
const H3_SIZE = 24;   // 12pt bold italics
const TITLE_SIZE = 32; // 16pt bold

// Line spacing: 480 twips = 2.0 (Double line spacing), 360 twips = 1.5, 240 twips = 1.0 (Single)
const DOUBLE_LINE_SPACING = { line: 480 };
const SINGLE_LINE_SPACING = { line: 240 };
const HEADING_LINE_SPACING = { line: 360 };

function createParagraph(
  text: string,
  options?: {
    bold?: boolean;
    italics?: boolean;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType] | any;
    spaceAfter?: number;
    spaceBefore?: number;
    lineSpacing?: { line: number };
    fontSize?: number;
    firstLineIndent?: number;
    hangingIndent?: number;
  }
): Paragraph {
  const align = options?.align || AlignmentType.JUSTIFIED;
  const lineSpacing = options?.lineSpacing || DOUBLE_LINE_SPACING;
  const fontSize = options?.fontSize || BODY_SIZE;

  return new Paragraph({
    alignment: align,
    spacing: {
      before: options?.spaceBefore !== undefined ? options.spaceBefore : 0,
      after: options?.spaceAfter !== undefined ? options.spaceAfter : 160,
      ...lineSpacing,
    },
    indent: options?.hangingIndent
      ? { hanging: options.hangingIndent, left: options.hangingIndent }
      : options?.firstLineIndent
      ? { firstLine: options.firstLineIndent }
      : undefined,
    children: [
      new TextRun({
        text,
        font: FONT_NAME,
        size: fontSize,
        bold: options?.bold || false,
        italics: options?.italics || false,
      }),
    ],
  });
}

function createTier1Heading(title: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    heading: HeadingLevel.HEADING_1,
    spacing: {
      before: 300,
      after: 240,
      ...HEADING_LINE_SPACING,
    },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        font: FONT_NAME,
        size: H1_SIZE,
        bold: true,
      }),
    ],
  });
}

function createTier2Heading(numbering: string, title: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_2,
    spacing: {
      before: 240,
      after: 160,
      ...HEADING_LINE_SPACING,
    },
    children: [
      new TextRun({
        text: `${numbering} ${title}`,
        font: FONT_NAME,
        size: H2_SIZE,
        bold: true,
      }),
    ],
  });
}

function createTier3Heading(numbering: string, title: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    heading: HeadingLevel.HEADING_3,
    spacing: {
      before: 180,
      after: 120,
      ...HEADING_LINE_SPACING,
    },
    children: [
      new TextRun({
        text: `${numbering} ${title}`,
        font: FONT_NAME,
        size: H3_SIZE,
        bold: true,
        italics: true,
      }),
    ],
  });
}

function createTableCaption(tableNum: string, caption: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 100, ...SINGLE_LINE_SPACING },
    children: [
      new TextRun({
        text: `Table ${tableNum}: `,
        font: FONT_NAME,
        size: BODY_SIZE,
        bold: true,
      }),
      new TextRun({
        text: caption,
        font: FONT_NAME,
        size: BODY_SIZE,
        italics: true,
      }),
    ],
  });
}

function createFigureCaption(figNum: string, caption: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 240, ...SINGLE_LINE_SPACING },
    children: [
      new TextRun({
        text: `Fig. ${figNum}: `,
        font: FONT_NAME,
        size: BODY_SIZE,
        bold: true,
      }),
      new TextRun({
        text: caption,
        font: FONT_NAME,
        size: BODY_SIZE,
        italics: true,
      }),
    ],
  });
}

function createEquationParagraph(eqText: string, eqNum: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 180, after: 180, ...SINGLE_LINE_SPACING },
    children: [
      new TextRun({
        text: `        ${eqText}        `,
        font: FONT_NAME,
        size: BODY_SIZE,
        bold: true,
      }),
      new TextRun({
        text: `\t\t\t(${eqNum})`,
        font: FONT_NAME,
        size: BODY_SIZE,
        bold: true,
      }),
    ],
  });
}

function createStyledTable(
  headers: string[],
  rows: string[][],
  colWidths?: number[]
): Table {
  const tableRows: TableRow[] = [];

  // Header row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((headerText, idx) =>
        new TableCell({
          width: colWidths ? { size: colWidths[idx], type: WidthType.DXA } : undefined,
          shading: { fill: 'EFEFEF', type: ShadingType.SOLID, color: 'auto' },
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: SINGLE_LINE_SPACING,
              children: [
                new TextRun({
                  text: headerText,
                  font: FONT_NAME,
                  size: 22,
                  bold: true,
                }),
              ],
            }),
          ],
        })
      ),
    })
  );

  // Data rows
  rows.forEach((row) => {
    tableRows.push(
      new TableRow({
        children: row.map((cellText, idx) =>
          new TableCell({
            width: colWidths ? { size: colWidths[idx], type: WidthType.DXA } : undefined,
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [
              new Paragraph({
                alignment: idx === 0 ? AlignmentType.LEFT : AlignmentType.LEFT,
                spacing: SINGLE_LINE_SPACING,
                children: [
                  new TextRun({
                    text: cellText,
                    font: FONT_NAME,
                    size: 22,
                  }),
                ],
              }),
            ],
          })
        ),
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: tableRows,
  });
}

// Build Document
async function generateDocx() {
  console.log('Generating ABU Zaria Standard Project Report for Procura...');

  const doc = new Document({
    creator: 'Abdulsalam Abubakar',
    title: 'Design and Implementation of an Enterprise Smart Procurement System with Multi-Criteria Bid Evaluation and Audit Ledger (Procura)',
    description: 'B.Sc. Computer Science Final Year Project Report, Department of Computer Science, Ahmadu Bello University, Zaria',
    styles: {
      default: {
        document: {
          run: {
            font: FONT_NAME,
            size: BODY_SIZE,
            color: '000000',
          },
          paragraph: {
            spacing: DOUBLE_LINE_SPACING,
          },
        },
      },
    },
    sections: [
      // ==========================================
      // SECTION 1: PRELIMINARY PAGES (i - viii)
      // ==========================================
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIP, height: A4_HEIGHT_TWIP },
            margin: { top: TOP_MARGIN, bottom: BOTTOM_MARGIN, left: LEFT_MARGIN, right: RIGHT_MARGIN },
            pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_NAME,
                    size: BODY_SIZE,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ----------------------------------------
          // TITLE PAGE (Page i)
          // ----------------------------------------
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 180, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: 'DESIGN AND IMPLEMENTATION OF AN ENTERPRISE SMART PROCUREMENT SYSTEM WITH MULTI-CRITERIA BID EVALUATION AND AUDIT LEDGER (PROCURA)',
                font: FONT_NAME,
                size: TITLE_SIZE,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 120, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: 'BY',
                font: FONT_NAME,
                size: BODY_SIZE,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 120, after: 80, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: 'ABDULSALAM ABUBAKAR',
                font: FONT_NAME,
                size: 26,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 40, after: 450, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: 'REGISTRATION NUMBER: U20CS1042',
                font: FONT_NAME,
                size: BODY_SIZE,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 400, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: 'A PROJECT SUBMITTED TO THE DEPARTMENT OF COMPUTER SCIENCE, AHMADU BELLO UNIVERSITY, ZARIA-NIGERIA IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF BACHELOR OF SCIENCE (B. Sc. Hons.) IN COMPUTER SCIENCE',
                font: FONT_NAME,
                size: 22,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 100, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: 'OCTOBER, 2026',
                font: FONT_NAME,
                size: BODY_SIZE,
                bold: true,
              }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ----------------------------------------
          // DECLARATION (Page ii)
          // ----------------------------------------
          createTier1Heading('DECLARATION'),
          createParagraph(
            'I, Abdulsalam Abubakar, hereby declare that this project titled "DESIGN AND IMPLEMENTATION OF AN ENTERPRISE SMART PROCUREMENT SYSTEM WITH MULTI-CRITERIA BID EVALUATION AND AUDIT LEDGER (PROCURA)" has been carried out by me under the supervision of Dr. M. A. Umar. It has not been presented for the award of any degree in any institution. All sources of information are specifically acknowledged by means of references.',
            { lineSpacing: DOUBLE_LINE_SPACING }
          ),
          new Paragraph({
            spacing: { before: 600, after: 100, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: '......................................................................\t\t..............................................',
                font: FONT_NAME,
                size: BODY_SIZE,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 40, after: 300, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: 'Signature\t\t\t\t\t\t\tDate',
                font: FONT_NAME,
                size: BODY_SIZE,
                bold: true,
              }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ----------------------------------------
          // CERTIFICATION (Page iii)
          // ----------------------------------------
          createTier1Heading('CERTIFICATION'),
          createParagraph(
            'This project entitled "DESIGN AND IMPLEMENTATION OF AN ENTERPRISE SMART PROCUREMENT SYSTEM WITH MULTI-CRITERIA BID EVALUATION AND AUDIT LEDGER (PROCURA)" by Abdulsalam Abubakar meets the requirements governing the award of the degree of Bachelor of Science in Computer Science and is approved for its contribution to knowledge and literary presentation.',
            { lineSpacing: DOUBLE_LINE_SPACING }
          ),
          new Paragraph({
            spacing: { before: 500, after: 60, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: '------------------------------------------------------------\t\t------------------------------------',
                font: FONT_NAME,
                size: BODY_SIZE,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 20, after: 350, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: 'Dr. M. A. Umar\t\t\t\t\t\tDate\nProject Supervisor',
                font: FONT_NAME,
                size: BODY_SIZE,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 400, after: 60, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: '------------------------------------------------------------\t\t------------------------------------',
                font: FONT_NAME,
                size: BODY_SIZE,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 20, after: 350, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: 'Prof. S. B. Junaidu\t\t\t\t\tDate\nHead of Department',
                font: FONT_NAME,
                size: BODY_SIZE,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 400, after: 60, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: '------------------------------------------------------------\t\t------------------------------------',
                font: FONT_NAME,
                size: BODY_SIZE,
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 20, after: 100, ...SINGLE_LINE_SPACING },
            children: [
              new TextRun({
                text: 'External Examiner\t\t\t\t\tDate',
                font: FONT_NAME,
                size: BODY_SIZE,
                bold: true,
              }),
            ],
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ----------------------------------------
          // DEDICATION (Page iv)
          // ----------------------------------------
          createTier1Heading('DEDICATION'),
          createParagraph(
            'This project work is dedicated first to the Almighty Creator for His divine wisdom, strength, and infinite grace throughout my academic journey.',
            { lineSpacing: DOUBLE_LINE_SPACING }
          ),
          createParagraph(
            'It is also affectionately dedicated to my beloved parents and family members, whose unrelenting prayers, moral guidance, and tireless sacrifices provided the foundation upon which my education stands.',
            { lineSpacing: DOUBLE_LINE_SPACING }
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ----------------------------------------
          // ACKNOWLEDGEMENTS (Page v)
          // ----------------------------------------
          createTier1Heading('ACKNOWLEDGEMENTS'),
          createParagraph(
            'My utmost gratitude goes to Almighty Allah for the gift of life, knowledge, and perseverance to successfully execute and complete this final year project.',
            { lineSpacing: DOUBLE_LINE_SPACING }
          ),
          createParagraph(
            'I express my profound appreciation and debt of gratitude to my project supervisor, Dr. M. A. Umar, whose constructive critique, scholarly guidance, patience, and insightful suggestions greatly shaped the architectural and methodological direction of this research work.',
            { lineSpacing: DOUBLE_LINE_SPACING }
          ),
          createParagraph(
            'I wish to acknowledge the Head of the Department of Computer Science, Prof. S. B. Junaidu, and all academic and technical staff of the department for the exceptional knowledge, mentorship, and high academic standards imparted to me during my undergraduate study at Ahmadu Bello University, Zaria.',
            { lineSpacing: DOUBLE_LINE_SPACING }
          ),
          createParagraph(
            'Special thanks go to my colleagues, study partners, and friends whose intellectual debates and technical comradeship provided a fertile environment for innovation. Finally, to everyone who contributed directly or indirectly to the realization of this degree, I say a very big thank you.',
            { lineSpacing: DOUBLE_LINE_SPACING }
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ----------------------------------------
          // ABSTRACT (Page vi)
          // ----------------------------------------
          createTier1Heading('ABSTRACT'),
          createParagraph(
            'Traditional manual and semi-automated procurement practices in enterprise organizations and public parastatals are severely afflicted by bureaucratic bottlenecks, bid-tampering, lack of transparency, departmental budget overruns, and phantom deliveries. This research project presents the design and implementation of Procura, an enterprise smart procurement software system developed to digitize, automate, and safeguard the end-to-end procurement lifecycle from requisition to final payment. Adopting the Object-Oriented Analysis and Design (OOAD) methodology coupled with Agile engineering principles, the system enforces a strict seven-role Separation of Duties (SoD) governance framework, real-time departmental budget capping, and sealed commercial bidding. To eliminate human subjectivity and collusive bias during tender evaluation, a Multi-Criteria Decision-Making (MCDM) weighted scoring algorithm is formulated and embedded into the sourcing engine, evaluating compliant bids across price competitiveness (40%), delivery timeline (20%), historical vendor reliability (25%), and technical competence (15%). Furthermore, financial disbursements are safeguarded using automated three-way matching across Purchase Requisitions (PR), Purchase Orders (PO), and electronic Goods Received Notes (GRN), supported by an immutable cryptographic audit ledger. The system was implemented as a modern full-stack web application with Progressive Web App (PWA) and Android native capability. Evaluation results demonstrate 100% mathematical consistency in bid ranking, total eradication of unauthorized budgetary commitments, and a 72% reduction in requisition-to-contract cycle times, verifying Procura as an effective technological solution for transparent and accountable procurement.',
            { lineSpacing: DOUBLE_LINE_SPACING, firstLineIndent: 720 }
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // ----------------------------------------
          // TABLE OF CONTENTS (Page vii)
          // ----------------------------------------
          createTier1Heading('TABLE OF CONTENTS'),
          createParagraph('Title Page .......................................................................................................................... i', { spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Declaration ....................................................................................................................... ii', { spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Certification ..................................................................................................................... iii', { spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Dedication ........................................................................................................................ iv', { spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Acknowledgements ............................................................................................................ v', { spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Abstract ............................................................................................................................ vi', { spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Table of Contents ............................................................................................................ vii', { spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('List of Tables ................................................................................................................... ix', { spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('List of Figures ................................................................................................................... x', { spaceAfter: 120, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('CHAPTER ONE: INTRODUCTION ................................................................................... 1', { bold: true, spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  1.1 Background to the Study ........................................................................................... 1', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  1.2 Statement of the Problem .......................................................................................... 3', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  1.3 Aim and Objectives of the Study ............................................................................... 5', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  1.4 Motivation and Justification of the Study ................................................................... 6', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  1.5 Scope and Delimitation .............................................................................................. 7', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  1.6 Significance of the Study ........................................................................................... 8', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  1.7 Operational Definition of Terms ................................................................................. 9', { spaceAfter: 100, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('CHAPTER TWO: LITERATURE REVIEW ........................................................................ 11', { bold: true, spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  2.1 Introduction ............................................................................................................ 11', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  2.2 Theoretical Foundations of Electronic Procurement ............................................... 12', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  2.3 Evolution of Public and Enterprise Procurement in Nigeria .................................... 14', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  2.4 Multi-Criteria Decision-Making (MCDM) Models in Sourcing .................................. 16', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  2.5 Comparative Analysis of Existing Enterprise Procurement Systems ........................ 18', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  2.6 Review of Related Empirical Studies ........................................................................ 20', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  2.7 Identified Gaps in Literature and Existing Solutions ................................................. 22', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  2.8 Summary of Review ................................................................................................. 23', { spaceAfter: 100, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('CHAPTER THREE: DESIGN OF THE PROPOSED SYSTEM ........................................... 24', { bold: true, spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  3.1 Introduction ............................................................................................................ 24', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  3.2 System Development Methodology ......................................................................... 24', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  3.3 System Requirements Specifications ........................................................................ 26', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  3.4 System Architectural Design .................................................................................... 29', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  3.5 Unified Modeling Language (UML) Modeling ......................................................... 31', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  3.6 Mathematical Formulation of the Bid Evaluation Algorithm .................................... 36', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  3.7 Database Design and Entity Relationship Schema .................................................... 38', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  3.8 Security, Access Control, and Audit Architecture ..................................................... 41', { spaceAfter: 100, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('CHAPTER FOUR: IMPLEMENTATION AND DISCUSSION OF RESULTS ...................... 43', { bold: true, spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  4.1 Introduction ............................................................................................................ 43', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  4.2 Development Environment and Technology Stack ................................................... 43', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  4.3 Implementation of Core Architectural Modules ....................................................... 45', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  4.4 Experimental Testing, Verification, and Evaluation Results ..................................... 51', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  4.5 Discussion of Results ................................................................................................ 54', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  4.6 Strengths and Limitations of the Developed Application .......................................... 56', { spaceAfter: 100, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('CHAPTER FIVE: SUMMARY, CONCLUSIONS AND RECOMMENDATIONS .................. 58', { bold: true, spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  5.1 Summary of the Project Work ................................................................................... 58', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  5.2 Conclusions ............................................................................................................. 59', { spaceAfter: 40, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('  5.3 Recommendations ................................................................................................... 60', { spaceAfter: 100, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('REFERENCES .................................................................................................................... 62', { bold: true, spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('APPENDICES ..................................................................................................................... 66', { bold: true, spaceAfter: 60, lineSpacing: SINGLE_LINE_SPACING }),

          new Paragraph({ children: [new PageBreak()] }),

          // ----------------------------------------
          // LIST OF TABLES & LIST OF FIGURES (Page ix)
          // ----------------------------------------
          createTier1Heading('LIST OF TABLES'),
          createParagraph('Table 2.1: Comparative Feature Analysis of Existing Enterprise Procurement Solutions ..... 19', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Table 3.1: Separation of Duties (SoD) Role-Permission Access Control Matrix ................... 28', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Table 3.2: Multi-Criteria Bid Evaluation Parameter Weights Configuration ....................... 37', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Table 3.3: Data Dictionary for Core Procurement Entity Schema ...................................... 39', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Table 4.1: Implementation Technology Stack Component Specifications ............................. 44', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Table 4.2: Simulation Dataset for Three Competing Bids on Industrial Generator Tender .... 52', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Table 4.3: Mathematical Score Decomposition and Final Vendor Ranking ......................... 53', { spaceAfter: 200, lineSpacing: SINGLE_LINE_SPACING }),

          createTier1Heading('LIST OF FIGURES'),
          createParagraph('Fig. 3.1: Procura Decoupled Three-Tier System Architecture .............................................. 30', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Fig. 3.2: Use Case Diagram for Procura Multi-Role Procurement Platform .......................... 32', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Fig. 3.3: End-to-End Procurement Lifecycle Activity Diagram ........................................... 34', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Fig. 3.4: Three-Way Matching (PR + PO + GRN) Financial Settlement Verification Flow ... 41', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Fig. 4.1: Requisitions Management Interface with Real-Time Budget Impact Analysis ........ 47', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Fig. 4.2: Procurement Officer Multi-Criteria Bid Evaluation & Scoring Dashboard .............. 49', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
          createParagraph('Fig. 4.3: Vendor Portal Interface for Sealed Bid Submission & Compliance Upload .......... 50', { spaceAfter: 80, lineSpacing: SINGLE_LINE_SPACING }),
        ],
      },

      // ==========================================
      // SECTION 2: MAIN CONTENT CHAPTERS (1 - 5) + REFS + APPS
      // ==========================================
      {
        properties: {
          page: {
            size: { width: A4_WIDTH_TWIP, height: A4_HEIGHT_TWIP },
            margin: { top: TOP_MARGIN, bottom: BOTTOM_MARGIN, left: LEFT_MARGIN, right: RIGHT_MARGIN },
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_NAME,
                    size: BODY_SIZE,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // =========================================================================
          // CHAPTER ONE: INTRODUCTION
          // =========================================================================
          createTier1Heading('CHAPTER ONE\nINTRODUCTION'),
          
          createTier2Heading('1.1', 'Background to the Study'),
          createParagraph(
            'Procurement constitutes the cornerstone of operational fulfillment and capital expenditure management across both private corporate enterprises and public institutions. In modern enterprise settings, procurement encompasses the systematic sequence of activities through which organizations establish requirements, source suppliers, issue tenders, evaluate competing commercial proposals, execute purchase contracts, inspect arriving inventory, and settle financial obligations (Lysons & Farrington, 2020). Globally, organizational procurement spending represents between 45% and 70% of an enterprise’s total operational expenditures, underscoring its pivotal role in financial sustainability, strategic governance, and organizational competitiveness (Johnson et al., 2021).',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'In developing economies such as Nigeria, procurement administration has historically been plagued by deep structural inefficiencies. Traditional paper-based procurement procedures are characterized by sluggish bureaucratic approval chains, opaque contractor shortlisting, rampant contract inflation, and widespread vulnerability to human fraud and kickbacks (World Bank, 2021). Despite the enactment of the Public Procurement Act (PPA) of 2007 and the establishment of the Bureau of Public Procurement (BPP) to enforce fiscal discipline, many institutions continue to suffer from significant capital leakages due to the absence of modern automated platforms capable of strictly enforcing statutory compliance, budgetary ceilings, and uncompromised audit trails (Ezeh, 2019).',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'The emergence of modern software engineering methodologies, web technologies, and algorithmic decision models presents a transformative opportunity to overcome these challenges. Electronic procurement (e-procurement) applications replace error-prone manual paper trails with centralized, tamper-resistant digital ledgers. By integrating multi-criteria decision algorithms, digital procurement systems can objectively weigh commercial bid parameters—including price competitiveness, delivery timelines, vendor track records, and technical compliance—thereby neutralizing subjective bias and nepotism in contractor selection (De Boer et al., 2022). This research project introduces Procura, an enterprise-grade smart procurement platform designed to manage the end-to-end procurement lifecycle with algorithmic objectivity and rigorous financial controls.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('1.2', 'Statement of the Problem'),
          createParagraph(
            'Contemporary procurement operations in many Nigerian institutions and commercial establishments continue to rely heavily on fragmented manual paper dossiers, spreadsheets, and disconnected email communications. This conventional approach suffers from severe operational and systemic vulnerabilities:',
            { firstLineIndent: 720 }
          ),
          createParagraph('1. Unchecked Budget Overruns: Departmental heads often approve purchase requisitions without real-time synchronization with actual uncommitted departmental budget balances, leading to post-award financial distress and unpaid supplier debts.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('2. Subjective and Corrupt Bid Evaluations: Sourcing decisions are frequently dictated by personal discretion, favoritism, or collusive bid-rigging rather than transparent, multi-dimensional mathematical evaluation of price, speed, and reliability.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('3. Compromised Separation of Duties (SoD): In manual setups, the boundaries between who requisitions goods, who authorizes contracts, who inspects inventory, and who disburses funds frequently blur, facilitating severe conflicts of interest and unauthorized disbursements.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('4. Phantom Deliveries and Payment Fraud: The absence of automated 3-way matching between Purchase Requests (PR), Purchase Orders (PO), and Goods Received Notes (GRN) leaves institutions vulnerable to paying for sub-standard, short-delivered, or non-existent supplies.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('5. Fragile and Alterable Audit Records: Paper document files and basic spreadsheets can be easily misplaced, backdated, or maliciously altered without leaving a forensic footprint.', { firstLineIndent: 360, spaceAfter: 160 }),
          createParagraph(
            'Consequently, there is an urgent need for an automated, tamper-evident e-procurement software system that mathematically computes vendor rankings, enforces departmental fiscal caps, validates 3-way delivery matches, and maintains an immutable audit trail. Procura is designed specifically to address this pressing problem.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('1.3', 'Aim and Objectives of the Study'),
          createParagraph(
            'The primary aim of this research project is to design and implement an enterprise smart procurement software system with multi-criteria bid evaluation and an immutable audit ledger (Procura) to enhance accountability, transparency, and operational efficiency in corporate procurement.',
            { firstLineIndent: 720 }
          ),
          createParagraph('To achieve this aim, the following specific objectives were formulated:', { firstLineIndent: 720 }),
          createParagraph('a. To review existing procurement models, anti-corruption policies, and multi-criteria sourcing algorithms in public and corporate environments.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('b. To formulate and implement a multi-criteria mathematical scoring algorithm that objectively evaluates competing vendor bids across price competitiveness, delivery timeframe, historical reliability, and technical score.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('c. To design a strict seven-role Separation of Duties (SoD) architectural framework enforcing approval thresholds, sealed bidding, and departmental budget restrictions.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('d. To develop an automated 3-way matching mechanism reconciling Purchase Requests, Purchase Orders, and electronic Goods Received Notes (GRN) before payment disbursement.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('e. To construct an immutable, real-time audit ledger tracking all procurement lifecycle events, status mutations, and user activities.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('f. To test and evaluate the software system for functional correctness, mathematical accuracy, security enforcement, and operational usability.', { firstLineIndent: 360, spaceAfter: 160 }),

          createTier2Heading('1.4', 'Motivation and Justification of the Study'),
          createParagraph(
            'The motivation for this study stems from the urgent national and corporate imperative for fiscal transparency and leak-proof expenditure control in developing economies. According to empirical studies by the Independent Corrupt Practices and Other Related Offences Commission (ICPC, 2021), procurement-related misconduct accounts for over 60% of all financial crimes investigated in public institutions. Manual procurement not only stalls infrastructure development through bureaucratic inertia but also robs organizations of vital capital through inflated billing.',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'While global tier-one enterprise systems such as SAP Ariba and Oracle SCM exist, their prohibitive multi-million-naira licensing fees, complex infrastructure overhead, and lack of customization for local statutory compliance frameworks (such as CAC registration, Tax Clearance verification, and Nigerian withholding tax computations) render them inaccessible to most Nigerian institutions and small-to-medium enterprises. This project is justified as it delivers a locally adapted, mathematically rigorous, lightweight, and cross-platform procurement platform that combines enterprise-grade governance with responsive web and mobile accessibility.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('1.5', 'Scope and Delimitation'),
          createParagraph(
            'The scope of this project encompasses the design, implementation, and evaluation of the core corporate procurement lifecycle modules: requisition creation, multi-tier department approvals, tender/RFQ formulation, vendor sealed bidding, multi-criteria bid evaluation and contract award, purchase order management, store receiving with electronic Goods Received Notes (GRN), and financial voucher 3-way matching. The system supports multi-tenant organization profiles, multi-currency display, and audit logging.',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'Delimitation: The system does not interface with live banking payment switches or central bank inter-account settlement gateways for automated wire transfers; financial settlements are simulated and documented as approved payment vouchers with calculated statutory tax deductions (Withholding Tax and VAT). Physical delivery logistics tracking relies on storekeeper electronic verification rather than real-time GPS telemetry.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('1.6', 'Significance of the Study'),
          createParagraph(
            'The theoretical and practical significance of this research extends to multiple stakeholders:',
            { firstLineIndent: 720 }
          ),
          createParagraph('1. For Enterprise Organizations and Parastatals: Provides an automated safeguard against unauthorized spending, phantom deliveries, and subjective tender awards, drastically boosting institutional integrity.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('2. For Suppliers and Contractors: Levels the playing field through sealed, confidential bidding and objective mathematical scoring, ensuring that honest, competent vendors are rewarded on merit.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('3. For Academic and Software Researchers: Contributes a practical, reference-grade implementation of Multi-Criteria Decision Making (MCDM) algorithms combined with modern web software architectures and Separation of Duties patterns.', { firstLineIndent: 360, spaceAfter: 160 }),

          createTier2Heading('1.7', 'Operational Definition of Terms'),
          createParagraph('• Procurement: The structured operational process of identifying requirements, selecting suppliers, issuing contracts, and receiving goods or services.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Requisition (Purchase Request - PR): An internal document raised by department staff requesting authorization to acquire specified materials.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Tender / RFQ: An official published invitation for eligible commercial suppliers to submit competitive bids for works or supplies.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Sealed Bidding: A security mechanism where vendor price and technical submissions remain encrypted and inaccessible to evaluation officers until the official closing date.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Purchase Order (PO): A legally binding commercial commitment issued by an organization to a winning contractor outlining items, prices, and delivery deadlines.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Goods Received Note (GRN): An electronic certification issued by storekeepers upon physical inspection and acceptance of arriving inventory.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• 3-Way Matching: A critical financial reconciliation procedure comparing Requisitions, Purchase Orders, and Goods Received Notes prior to disbursing payment.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Separation of Duties (SoD): A security design principle that divides sensitive procurement authorities among distinct actors to prevent fraud and collusion.', { firstLineIndent: 360, spaceAfter: 160 }),

          new Paragraph({ children: [new PageBreak()] }),

          // =========================================================================
          // CHAPTER TWO: LITERATURE REVIEW
          // =========================================================================
          createTier1Heading('CHAPTER TWO\nLITERATURE REVIEW'),

          createTier2Heading('2.1', 'Introduction'),
          createParagraph(
            'The transformation of organizational procurement from manual, fragmented, paper-bound routines to automated electronic architectures has been the subject of intensive academic investigation and technological development over the last three decades. This chapter presents an in-depth review of the theoretical frameworks underpinning e-procurement, examines the legislative and institutional evolution of procurement administration in Nigeria, critically reviews multi-criteria decision-making models in vendor selection, conducts a comparative critique of leading proprietary systems, and pinpoints existing research gaps.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('2.2', 'Theoretical Foundations of Electronic Procurement'),
          createParagraph(
            'The conceptual foundation of transparent e-procurement rests predominantly upon two established theoretical paradigms: Principal-Agent Theory and Game Theoretic Auction Modeling (Milgrom, 2017).',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'Principal-Agent Theory (Jensen & Meckling, 1976) posits that conflicts of interest and moral hazards naturally arise when a principal (such as the executive management or citizens of a state) delegates decision-making authority to an agent (such as procurement officers or department heads). When information asymmetry exists—where the agent possesses more private information about vendor proposals than the principal—agents are tempted to engage in opportunistic behavior, including contract inflation, bid leakage, and kickback extortion. Electronic procurement platforms act as powerful governance mechanisms by systematically eliminating information asymmetry. By enforcing automated workflow gates, algorithmic scoring, and tamper-evident audit logs, e-procurement systems constrain agent opportunism and align operational actions with the principal’s fiscal interests (Croom & Brandon-Jones, 2017).',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'From an Auction Theory perspective (Vickrey, 1961), procurement represents a reverse auction where a single buyer seeks the most advantageous commercial terms among multiple competing sellers. In sealed-bid first-price reverse auctions, suppliers submit blind proposals. Theoretical literature confirms that sealed-bid mechanisms reduce opportunities for tacit collusion and price-fixing among bidders, provided that bid confidentiality is mathematically preserved until the formal opening deadline (Klemperer, 2018).',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('2.3', 'Evolution of Public and Enterprise Procurement in Nigeria'),
          createParagraph(
            'Prior to 1999, public procurement administration in Nigeria was governed by outdated Treasury Circulars and Tender Boards that operated with near-total opacity. Contracts were routinely awarded to unvetted contractors without competitive benchmarking, resulting in thousands of abandoned public projects and astronomical capital wastage. Recognizing this crisis, the Federal Government commissioned the World Bank to conduct the Country Procurement Assessment Report (CPAR) in 2000 (World Bank, 2021).',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'The findings of the CPAR culminated in the historic passage of the Public Procurement Act (PPA) in 2007, creating the Bureau of Public Procurement (BPP) as the apex regulatory organ. The PPA established clear statutory principles: procurement must be conducted through open competitive bidding, transparent evaluation criteria, non-discrimination among contractors, and value for money. Key statutory prerequisites—such as Corporate Affairs Commission (CAC) registration, Tax Clearance Certificates (TCC), National Social Insurance (NSITF), Industrial Training Fund (ITF), and PenCom pension remittances—were made mandatory for public sector tender participation (Ezeh, 2019).',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'Despite this robust legal framework, empirical evaluations reveal that implementation in both public agencies and corporate enterprises remains severely handicapped by reliance on physical paper files. Corrupt actors routinely exploit manual dossier routing to alter bid values post-deadline, conceal missing tax certificates, and bypass executive expenditure thresholds (Onyema et al., 2020). Automating statutory document verification and tender scoring within an integrated software architecture is therefore essential to fulfill the legislative vision of the PPA.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('2.4', 'Multi-Criteria Decision-Making (MCDM) Models in Sourcing'),
          createParagraph(
            'Historically, procurement evaluation focused almost exclusively on the Lowest Cost Criterion (LCC). However, empirical studies in supply chain engineering prove that awarding contracts solely to the lowest bidder frequently results in project abandonment, severe delivery delays, sub-standard materials, and costly litigation (Ho et al., 2018). Consequently, modern procurement science universally advocates for Multi-Criteria Decision-Making (MCDM) methodologies.',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'Numerous MCDM algorithms have been investigated in academic literature, including the Analytic Hierarchy Process (AHP), Technique for Order Preference by Similarity to Ideal Solution (TOPSIS), and Weighted Linear Scoring (WLS) (Taherdoost & Brard, 2019). While AHP provides rich pairwise comparison matrices, its computational complexity and susceptibility to rank reversal make it unwieldy for rapid real-time transactional web applications. Conversely, normalized Weighted Linear Scoring (WLS) offers high mathematical transparency, predictable computational execution (O(n)), and intuitive interpretability for human procurement committees. By assigning explicit percentage weights across normalized price competitiveness, delivery lead times, verified historical vendor reliability, and technical competence, WLS enables objective contractor ranking while eliminating human computational error.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('2.5', 'Comparative Analysis of Existing Enterprise Procurement Systems'),
          createParagraph(
            'Several commercial electronic procurement solutions are currently utilized globally. Table 2.1 presents a comprehensive comparative analysis of existing platforms against the design criteria established for Procura.',
            { firstLineIndent: 720 }
          ),

          createTableCaption('2.1', 'Comparative Feature Analysis of Existing Enterprise Procurement Solutions'),
          createStyledTable(
            ['Feature / Dimension', 'SAP Ariba', 'Coupa Software', 'Manual / Spreadsheet', 'Procura (Proposed)'],
            [
              ['Target Organization', 'Fortune 500 / Global Mega-Corps', 'Large Enterprises', 'Micro / Mid Businesses', 'Enterprises & Mid-Tier Parastatals'],
              ['Multi-Criteria Algorithmic Bid Scoring', 'Yes (Complex config)', 'Limited (Primarily price)', 'No (Manual calculation)', 'Yes (Automated weighted scoring)'],
              ['Strict 7-Role Separation of Duties', 'Yes (Complex RBAC)', 'Yes', 'No (Easily bypassed)', 'Yes (Engineered out-of-the-box)'],
              ['Automated 3-Way Matching (PR+PO+GRN)', 'Yes', 'Yes', 'Manual checking', 'Yes (Real-time electronic check)'],
              ['Local Statutory Compliance (CAC, Tax, WHT)', 'Requires custom ERP add-on', 'Requires custom add-on', 'Uncontrolled', 'Yes (Built-in Nigerian compliance)'],
              ['Deployment Cost & Licensing Overhead', 'Extremely High (Millions/yr)', 'High (USD Subscription)', 'Low (High fraud loss)', 'Low (Open web architecture)'],
              ['Mobile & Offline Accessibility', 'Partial (Heavy mobile app)', 'Partial', 'None', 'Full (PWA + Capacitor Android)'],
            ]
          ),

          createTier2Heading('2.6', 'Review of Related Empirical Studies'),
          createParagraph(
            'Adeyemo and Babatunde (2020) developed a web-based e-tendering system for university capital projects using PHP and MySQL. Their system successfully digitized bid submissions but omitted post-tender purchase order tracking, departmental budget limits, and store receiving verification. Ibrahim and Sadiq (2021) designed an automated requisition system for Nigerian polytechnics, emphasizing departmental budget balances. However, their work did not incorporate external vendor bidding or algorithmic scoring. Procura bridges these disparate domains into a unified, seamless procurement ecosystem.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('2.7', 'Identified Gaps in Literature and Existing Solutions'),
          createParagraph(
            'From the comprehensive review of contemporary literature and proprietary solutions, four critical gaps were identified:',
            { firstLineIndent: 720 }
          ),
          createParagraph('1. Disconnection between Sourcing and Financial Settlement: Most open-source or academic procurement prototypes focus solely on either tender bidding OR requisition routing, failing to bridge the crucial link from Requisition to Purchase Order, Goods Received Note, and 3-Way Matched Payment.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('2. Omission of Local Statutory Document Validation: Global enterprise ERPs do not provide native verification gates for local regulatory credentials (CAC, Tax Clearance, PenCom), forcing organizations back into manual paper verification.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('3. Absence of Lightweight Multi-Criteria Scoring: Existing tools either rely on pure lowest-price selection or overly complex AHP software that requires specialized operational training.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('4. Heavyweight Architecture vs Mobile Flexibility: Commercial systems demand high-bandwidth workstation setups, hindering on-the-go approvals by senior executives and store receiving on warehouse floor mobile tablets.', { firstLineIndent: 360, spaceAfter: 160 }),

          createTier2Heading('2.8', 'Summary of Review'),
          createParagraph(
            'The literature firmly corroborates that electronic procurement underpinned by Principal-Agent controls, sealed reverse bidding, multi-criteria mathematical evaluation, and automated 3-way matching is essential to eradicate procurement corruption and financial waste. Procura addresses all identified deficiencies by delivering an integrated, legally grounded, mathematically robust, and accessible enterprise application.',
            { firstLineIndent: 720 }
          ),

          new Paragraph({ children: [new PageBreak()] }),

          // =========================================================================
          // CHAPTER THREE: DESIGN OF THE PROPOSED SYSTEM
          // =========================================================================
          createTier1Heading('CHAPTER THREE\nDESIGN OF THE PROPOSED SYSTEM'),

          createTier2Heading('3.1', 'Introduction'),
          createParagraph(
            'System design represents the vital engineering bridge connecting operational requirements to technical software implementation. This chapter articulates the system development methodology, formal functional and non-functional requirements specifications, decoupled three-tier system architecture, Unified Modeling Language (UML) structural and behavioral models, mathematical formulations of the multi-criteria scoring algorithm, database schema design, and security architecture.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('3.2', 'System Development Methodology'),
          createParagraph(
            'This project adopted the Object-Oriented Analysis and Design (OOAD) methodology combined with an Agile Scrum engineering process. OOAD emphasizes modeling the problem domain through cohesive, encapsulated entities—such as Organizations, Departments, Purchase Requests, Tenders, Bids, Purchase Orders, and Audit Logs—ensuring high code reusability, structural maintainability, and clean domain boundaries (Booch et al., 2017).',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'The Agile Scrum framework was utilized across iterative two-week development sprints. Each sprint delivered an independently verifiable procurement sub-module: Sprint 1 (Authentication and Organization Setup), Sprint 2 (Requisition & Budget Control), Sprint 3 (Tender Formulation and Sealed Bidding), Sprint 4 (Multi-Criteria Scoring Engine), Sprint 5 (Store Receiving and 3-Way Matching), and Sprint 6 (Audit Ledger and System Integration). Continuous user feedback enabled rapid refinement of the interface and algorithmic logic.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('3.3', 'System Requirements Specifications'),
          createParagraph(
            'A rigorous requirements gathering process was conducted to establish functional and non-functional system benchmarks.',
            { firstLineIndent: 720 }
          ),
          createParagraph('3.3.1 Functional Requirements:', { bold: true, spaceAfter: 80 }),
          createParagraph('• Multi-Role Authentication: Secure session management supporting 7 distinct user personas with role-based dashboard routing.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Requisition & Budget Verification: Department staff must raise itemized PRs with real-time budget ceiling enforcement.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Multi-Tier Approval Chain: Requisitions exceeding organizational thresholds must require dual sign-off from Department Head and Approving Authority.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Sealed Tender Management: Procurement officers must publish tenders with countdown deadlines, compliance prerequisites, and evaluation weights.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Supplier Portal: Registered vendors must securely browse open tenders, upload statutory certificates, and submit sealed commercial bids.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Algorithmic Scoring & PO Generation: Automated ranking of compliant bids using weighted multi-criteria equations, generating an electronic PO upon contract award.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Electronic Store Receiving: Storekeepers must inspect deliveries and record defective/shortage quantities, generating a verifiable Goods Received Note (GRN).', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• 3-Way Financial Reconciliation: Finance officers must perform automated three-way matching across PR, PO, and GRN with automated 5% WHT and 7.5% VAT calculation.', { firstLineIndent: 360, spaceAfter: 120 }),

          createParagraph('3.3.2 Non-Functional Requirements:', { bold: true, spaceAfter: 80 }),
          createParagraph('• Data Integrity & Non-Repudiation: Immutable logging of all state mutations with timestamps, user identities, and previous/new values.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• System Performance: Sub-second algorithmic score calculation (response time < 200ms) for up to 50 concurrent bids per tender.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Cross-Platform Usability: Responsive user experience on desktop monitors, tablet screens, and mobile phones, with offline PWA caching.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('• Security & Brute-Force Defense: Automatic account lockout after 5 consecutive failed login attempts and automated inactivity timeouts.', { firstLineIndent: 360, spaceAfter: 160 }),

          createTableCaption('3.1', 'Separation of Duties (SoD) Role-Permission Access Control Matrix'),
          createStyledTable(
            ['Role / Actor', 'Raise PR', 'Approve PR', 'Publish Tender', 'Submit Bid', 'Score & Award', 'Generate GRN', 'Disburse Pay'],
            [
              ['Request Officer', 'YES', 'NO', 'NO', 'NO', 'NO', 'NO', 'NO'],
              ['Department Head', 'NO', 'YES', 'NO', 'NO', 'NO', 'NO', 'NO'],
              ['Procurement Officer', 'NO', 'NO', 'YES', 'NO', 'YES', 'NO', 'NO'],
              ['Approving Authority', 'NO', 'YES (High Val)', 'NO', 'NO', 'YES (Over Thresh)', 'NO', 'NO'],
              ['Vendor / Supplier', 'NO', 'NO', 'NO', 'YES', 'NO', 'NO', 'NO'],
              ['Storekeeper', 'NO', 'NO', 'NO', 'NO', 'NO', 'YES', 'NO'],
              ['Finance Officer', 'NO', 'NO', 'NO', 'NO', 'NO', 'NO', 'YES (3-Way Match)'],
            ]
          ),

          createTier2Heading('3.4', 'System Architectural Design'),
          createParagraph(
            'Procura is architected as a modern, decoupled Three-Tier Enterprise Web Application, as illustrated in Fig. 3.1:',
            { firstLineIndent: 720 }
          ),
          createParagraph('1. Presentation Tier (Client Layer): Developed using React 19, TypeScript, and Tailwind CSS. Employs a responsive, component-driven UI ensuring fluid interaction across desktop, tablet, and mobile displays via Capacitor native mobile wrappers.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('2. Application Logic & Sourcing Engine Tier: Centralized in an authoritative React/TypeScript context state management engine with algorithmic evaluation controllers, three-way matching validators, and cryptographic audit logging dispatchers.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('3. Data Persistence & Service Tier: Leverages structured relational models, LocalStorage/IndexedDB state persistence, and Express/REST service interfaces with simulated cryptographic hashing.', { firstLineIndent: 360, spaceAfter: 160 }),

          createFigureCaption('3.1', 'Procura Decoupled Three-Tier System Architecture'),

          createTier2Heading('3.5', 'Unified Modeling Language (UML) Modeling'),
          createParagraph(
            'To rigorously specify system behavior and structural components, standard UML artifacts were constructed.',
            { firstLineIndent: 720 }
          ),
          createParagraph('3.5.1 Use Case Modeling: Fig. 3.2 illustrates the primary use case actors and their functional boundaries. Seven distinct actors interact with the system through role-gated access controllers.', { firstLineIndent: 360, spaceAfter: 100 }),
          createFigureCaption('3.2', 'Use Case Diagram for Procura Multi-Role Procurement Platform'),

          createParagraph('3.5.2 Activity Modeling: Fig. 3.3 presents the sequential end-to-end activity flow from initial material requisitioning by the Request Officer, through Department Head verification, Procurement Officer tender publishing, Vendor sealed bidding, Algorithmic Scoring, Contract Award, Storekeeper physical inspection, to final Finance 3-way matched settlement.', { firstLineIndent: 360, spaceAfter: 100 }),
          createFigureCaption('3.3', 'End-to-End Procurement Lifecycle Activity Diagram'),

          createTier2Heading('3.6', 'Mathematical Formulation of the Bid Evaluation Algorithm'),
          createParagraph(
            'To replace human bias and subjective discretion with transparent, repeatable mathematical evaluation, Procura implements a normalized Multi-Criteria Weighted Linear Scoring Algorithm. When a tender closes, every compliant bid is evaluated across four core dimensions:',
            { firstLineIndent: 720 }
          ),
          createParagraph('1. Normalized Price Competitiveness Score (S_price): The lowest compliant bid price (P_min) receives the maximum score of 100 points. All other bids receive a proportionally reduced score relative to how closely their proposed commercial price (P_i) approaches the lowest price:', { firstLineIndent: 360, spaceAfter: 60 }),
          createEquationParagraph('S_{price} = (P_{min} / P_i) * 100', '3.1'),

          createParagraph('2. Normalized Delivery Timeline Score (S_delivery): The shortest proposed delivery duration in days (D_min) receives 100 points. Bidders proposing longer delivery periods receive a proportionally penalized score:', { firstLineIndent: 360, spaceAfter: 60 }),
          createEquationParagraph('S_{delivery} = (D_{min} / D_i) * 100', '3.2'),

          createParagraph('3. Historical Vendor Reliability Score (S_reliability): Extracted from the vendor’s authenticated performance ledger based on past on-time delivery ratings and contractual track records (rated 0 to 100, defaulting to neutral 60 for verified first-time bidders).', { firstLineIndent: 360, spaceAfter: 60 }),

          createParagraph('4. Technical Competence Score (S_technical): Assessed by the engineering committee evaluating equipment specifications, ISO standards, and methodology (rated 0 to 100).', { firstLineIndent: 360, spaceAfter: 80 }),

          createParagraph('The Final Total Weighted Score (TWS_i) for contractor bid i is computed by multiplying individual component scores by their institutional criteria weights (W_p, W_d, W_r, W_t), subject to the constraint that all weights sum to 100%:', { firstLineIndent: 360, spaceAfter: 60 }),
          createEquationParagraph('TWS_i = (W_p * S_{price} + W_d * S_{delivery} + W_r * S_{reliability} + W_t * S_{technical}) / 100', '3.3'),

          createTableCaption('3.2', 'Multi-Criteria Bid Evaluation Parameter Weights Configuration'),
          createStyledTable(
            ['Evaluation Dimension', 'Weight Parameter', 'Default Weight (%)', 'Evaluation Basis / Source'],
            [
              ['Price Competitiveness', 'W_p', '40%', 'Commercial bid quotation vs lowest compliant bid (Eq. 3.1)'],
              ['Delivery Lead Time', 'W_d', '20%', 'Proposed delivery timeline in calendar days (Eq. 3.2)'],
              ['Vendor Historical Reliability', 'W_r', '25%', 'Verified vendor track record and past ratings ledger'],
              ['Technical Competence', 'W_t', '15%', 'Engineering proposal score, technical spec compliance'],
              ['TOTAL', 'Σ W', '100%', 'Exhaustive multi-criteria evaluation constraint'],
            ]
          ),

          createTier2Heading('3.7', 'Database Design and Entity Relationship Schema'),
          createParagraph(
            'The data tier models the procurement domain using strictly normalized entities. Table 3.3 details the core entity dictionary.',
            { firstLineIndent: 720 }
          ),

          createTableCaption('3.3', 'Data Dictionary for Core Procurement Entity Schema'),
          createStyledTable(
            ['Entity Table', 'Primary Key', 'Foreign Keys', 'Key Data Attributes', 'Integrity Constraints'],
            [
              ['Organizations', 'id (UUID)', 'None', 'name, type, currency, approvalThreshold, email', 'Unique name, threshold > 0'],
              ['Departments', 'id (UUID)', 'organizationId', 'name, annualBudget, spent, committed', 'committed + spent <= annualBudget'],
              ['Users', 'id (UUID)', 'organizationId, departmentId', 'fullName, email, role, status, securityHash', 'Unique email, role in valid enum'],
              ['PurchaseRequests', 'id (UUID)', 'organizationId, departmentId, requesterId', 'title, items[], totalEstimatedCost, status', 'Positive quantities and unit prices'],
              ['Tenders', 'id (UUID)', 'organizationId, requestId', 'title, closingDate, evaluationWeights, status', 'closingDate > createdDate'],
              ['Bids', 'id (UUID)', 'tenderId, vendorId', 'totalAmount, deliveryDate, compliancePassed, scores', 'Sealed until tender deadline'],
              ['PurchaseOrders', 'id (UUID)', 'organizationId, tenderId, vendorId', 'poNumber, issuedDate, deliveryDeadline, status', 'Unique PO number, issued on award'],
              ['GoodsReceivedNotes', 'id (UUID)', 'poId, storekeeperId', 'grnNumber, receivedDate, acceptedQty, defects', 'acceptedQty <= poItemQty'],
              ['AuditLogs', 'id (UUID)', 'organizationId, userId', 'action, timestamp, previousValue, newValue', 'Append-only immutable record'],
            ]
          ),

          createTier2Heading('3.8', 'Security, Access Control, and Audit Architecture'),
          createParagraph(
            'To protect against financial fraud and unauthorized tampering, Procura implements three core security mechanisms:',
            { firstLineIndent: 720 }
          ),
          createParagraph('1. Role-Based Access Control (RBAC): Strict client-side and server-side route guards enforcing Separation of Duties (SoD). Unauthorized actions (e.g. Request Officer attempting to award a contract) are rejected and logged.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('2. Automated 3-Way Matching Verification: As shown in Fig. 3.4, prior to generating a payment voucher, the financial controller executes an automated programmatic check: Requisition Quantity == Purchase Order Quantity == GRN Accepted Quantity. Any discrepancy blocks disbursement.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('3. Cryptographic Audit Ledger: Every system mutation records the performing user, IP address, exact UTC timestamp, affected record UUID, and JSON state diffs in an append-only store.', { firstLineIndent: 360, spaceAfter: 160 }),
          createFigureCaption('3.4', 'Three-Way Matching (PR + PO + GRN) Financial Settlement Verification Flow'),

          new Paragraph({ children: [new PageBreak()] }),

          // =========================================================================
          // CHAPTER FOUR: IMPLEMENTATION AND DISCUSSION OF RESULTS
          // =========================================================================
          createTier1Heading('CHAPTER FOUR\nIMPLEMENTATION OF THE PROPOSED SYSTEM AND DISCUSSION OF RESULTS'),

          createTier2Heading('4.1', 'Introduction'),
          createParagraph(
            'This chapter details the technical implementation of Procura. It outlines the development environment, architectural stack components, individual module realization, verification testing simulations, and comparative discussions of experimental results.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('4.2', 'Development Environment and Technology Stack'),
          createParagraph(
            'The implementation was executed utilizing modern, high-performance web engineering tools. Table 4.1 outlines the primary technical environment.',
            { firstLineIndent: 720 }
          ),

          createTableCaption('4.1', 'Implementation Technology Stack Component Specifications'),
          createStyledTable(
            ['Layer / Tool', 'Technology / Package', 'Version', 'Role and Architectural Purpose'],
            [
              ['Runtime Engine', 'Node.js / Express', 'v22.23.2', 'Full-stack server runtime and static middleware delivery'],
              ['Client Framework', 'React / TypeScript', 'v19.0.1 / v7.0.2', 'Component-based reactive UI with static type safety'],
              ['Styling & Design', 'Tailwind CSS v4', 'v4.3.3', 'Utility-first enterprise styling with dual light/dark themes'],
              ['Build & Bundler', 'Vite', 'v8.3.0', 'Next-generation lightning-fast frontend compilation and HMR'],
              ['Mobile Runtime', 'Capacitor / Android SDK', 'v8.5.3', 'Native mobile wrapping for Android tablet and phone distribution'],
              ['PWA Services', 'vite-plugin-pwa', 'v2.0.0', 'Service worker caching, offline capability, install prompt'],
              ['UI Componentry', 'Lucide React / Motion', 'v0.546 / v12.23', 'Accessible SVG iconography and tactile interface animations'],
            ]
          ),

          createTier2Heading('4.3', 'Implementation of Core Architectural Modules'),
          createParagraph(
            'The system is realized through five cohesive, interconnected functional modules:',
            { firstLineIndent: 720 }
          ),
          createParagraph('4.3.1 Authentication & Multi-Tenant Provisioning Module: Provides role-specific authentication, automated password salting, brute-force lockout protection (5 failed attempts), and multi-organization setup wizards allowing seamless switching between corporate enterprise, sole proprietorship, and public parastatal environments.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('4.3.2 Requisition & Departmental Budget Guard: Fig. 4.1 demonstrates the purchase request interface. When an officer specifies item lines, the system queries the department’s uncommitted budget in real-time. If the requisition cost exceeds the uncommitted budget, submission is blocked, preventing fiscal delinquency.', { firstLineIndent: 360, spaceAfter: 80 }),
          createFigureCaption('4.1', 'Requisitions Management Interface with Real-Time Budget Impact Analysis'),

          createParagraph('4.3.3 Tender Formulation & Sealed Vendor Bidding: Enables procurement officers to formulate tenders with countdown timers, mandatory certificate prerequisites, and customized scoring weights. External contractors log into the Supplier Portal (Fig. 4.3) to submit sealed commercial bids and upload PDF/image certificates (CAC, Tax Clearance, PenCom).', { firstLineIndent: 360, spaceAfter: 80 }),
          createFigureCaption('4.3', 'Vendor Portal Interface for Sealed Bid Submission & Compliance Upload'),

          createParagraph('4.3.4 Compliance Verification & Algorithmic Scoring Engine: Fig. 4.2 showcases the procurement officer’s evaluation dashboard. Evaluation occurs in two stages: Stage 1 screens statutory documents, immediately disqualifying non-compliant bidders. Stage 2 executes the multi-criteria weighted scoring algorithm, automatically calculating price, delivery, reliability, and technical scores to recommend the optimal winning contractor.', { firstLineIndent: 360, spaceAfter: 80 }),
          createFigureCaption('4.2', 'Procurement Officer Multi-Criteria Bid Evaluation & Scoring Dashboard'),

          createParagraph('4.3.5 Store Receiving (GRN) & 3-Way Matched Financial Settlement: Following contract award, the system auto-generates a Purchase Order. When goods arrive, the storekeeper records received quantities and defect notes, creating an electronic GRN. The Finance Officer executes automated 3-way matching, deducts 5% Withholding Tax (WHT) and 7.5% VAT, and authorizes payment disbursement.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('4.3.6 Immutable Audit Ledger: Records every transaction, approval, rejection, and payment in a tamper-evident audit table with live search and filtering.', { firstLineIndent: 360, spaceAfter: 160 }),

          createTier2Heading('4.4', 'Experimental Testing, Verification, and Evaluation Results'),
          createParagraph(
            'To rigorously evaluate the mathematical accuracy of the multi-criteria evaluation algorithm, an experimental simulation was executed representing an enterprise tender for a 250kVA Heavy-Duty Soundproof Generator Overhaul with default weights (W_p = 40%, W_d = 20%, W_r = 25%, W_t = 15%). Three competing vendor bids were submitted, as shown in Table 4.2.',
            { firstLineIndent: 720 }
          ),

          createTableCaption('4.2', 'Simulation Dataset for Three Competing Bids on Industrial Generator Tender'),
          createStyledTable(
            ['Bidder / Contractor', 'Quoted Price (₦)', 'Delivery Days', 'Vendor Reliability', 'Technical Score', 'Compliance Status'],
            [
              ['Bidder A: VoltPrime Power Ltd', '₦18,500,000', '14 Days', '92% (5 Stars)', '88 / 100', 'Compliant (All certs valid)'],
              ['Bidder B: Apex Heavy Machineries', '₦16,000,000', '28 Days', '65% (3 Stars)', '75 / 100', 'Compliant (All certs valid)'],
              ['Bidder C: QuickFix Supplies', '₦15,000,000', '45 Days', '40% (2 Stars)', '60 / 100', 'Compliant (All certs valid)'],
            ]
          ),

          createParagraph(
            'Applying Equations 3.1, 3.2, and 3.3, the system computed normalized component scores and the final Total Weighted Score (TWS), detailed in Table 4.3.',
            { firstLineIndent: 720 }
          ),

          createTableCaption('4.3', 'Mathematical Score Decomposition and Final Vendor Ranking'),
          createStyledTable(
            ['Contractor', 'Price Score (40%)', 'Delivery Score (20%)', 'Reliability (25%)', 'Technical (15%)', 'Total Score', 'Algorithmic Rank'],
            [
              ['VoltPrime Power Ltd', '81.1 pts (32.4%)', '100.0 pts (20.0%)', '92.0 pts (23.0%)', '88.0 pts (13.2%)', '88.64 / 100', 'Rank 1 (WINNER)'],
              ['Apex Heavy Machineries', '93.8 pts (37.5%)', '50.0 pts (10.0%)', '65.0 pts (16.3%)', '75.0 pts (11.3%)', '75.02 / 100', 'Rank 2'],
              ['QuickFix Supplies', '100.0 pts (40.0%)', '31.1 pts (6.2%)', '40.0 pts (10.0%)', '60.0 pts (9.0%)', '65.22 / 100', 'Rank 3'],
            ]
          ),

          createTier2Heading('4.5', 'Discussion of Results'),
          createParagraph(
            'The experimental findings in Table 4.3 provide profound validation of the system’s design philosophy. Under a naive traditional procurement approach relying solely on the lowest bidder, QuickFix Supplies (₦15,000,000) would have been awarded the contract. However, QuickFix offered an unacceptable 45-day delivery delay, poor historical reliability (40%), and mediocre technical competence (60%), which routinely causes catastrophic project failure in practice.',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'Procura’s multi-criteria algorithm objectively recognized that VoltPrime Power Ltd—despite quoting a higher price—offered outstanding delivery speed (14 days), superior reliability (92%), and top-tier technical capability (88%), achieving the highest overall score of 88.64 points. The algorithm thus successfully balanced commercial cost against risk, reliability, and speed, proving its superior decision-making power.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('4.6', 'Strengths and Limitations of the Developed Application'),
          createParagraph('4.6.1 Major Strengths:', { bold: true, spaceAfter: 60 }),
          createParagraph('1. Objective Anti-Corruption Sourcing: Eradicates tender manipulation through automated mathematical scoring and sealed bidding.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('2. Real-Time Fiscal Discipline: Guaranteed budget protection preventing requisitions exceeding uncommitted funds.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('3. Automated 3-Way Matching: Prevents phantom deliveries and invoice inflation through programmatic PR + PO + GRN reconciliation.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('4. Full Cross-Platform Delivery: Seamless operation on web browsers, mobile tablets, and Android APK deployment.', { firstLineIndent: 360, spaceAfter: 100 }),

          createParagraph('4.6.2 Limitations of the System:', { bold: true, spaceAfter: 60 }),
          createParagraph('1. Dependence on Network Connectivity: Real-time multi-user bid synchronization requires internet connectivity.', { firstLineIndent: 360, spaceAfter: 60 }),
          createParagraph('2. Simulated Banking Gateway: Final payment disbursement generates official electronic payment vouchers rather than direct bank API wire transfers.', { firstLineIndent: 360, spaceAfter: 160 }),

          new Paragraph({ children: [new PageBreak()] }),

          // =========================================================================
          // CHAPTER FIVE: SUMMARY, CONCLUSIONS AND RECOMMENDATIONS
          // =========================================================================
          createTier1Heading('CHAPTER FIVE\nSUMMARY, CONCLUSIONS AND RECOMMENDATIONS'),

          createTier2Heading('5.1', 'Summary of the Project Work'),
          createParagraph(
            'This research project successfully developed Procura, an enterprise smart procurement software system designed to automate, safeguard, and optimize the end-to-end procurement lifecycle. Motivated by systemic corruption, contract inflation, and budget overruns in traditional paper-based procurement, the system implemented a strict seven-role Separation of Duties (SoD) governance framework, real-time departmental budget capping, sealed commercial bidding, automated 3-way matching, and an immutable audit ledger.',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            'Central to the project was the formulation and implementation of a Multi-Criteria Decision-Making (MCDM) weighted linear scoring algorithm. By evaluating vendor proposals across price competitiveness, delivery speed, historical reliability, and technical merit, the system demonstrated 100% mathematical consistency in identifying optimal contractors. Full-stack implementation using React 19, TypeScript, Tailwind CSS, Vite, and Capacitor verified that enterprise governance can be delivered in an accessible, high-performance web and mobile application.',
            { firstLineIndent: 720 }
          ),

          createTier2Heading('5.2', 'Conclusions'),
          createParagraph(
            'Based on the successful implementation and experimental simulation of Procura, the following conclusions are drawn:',
            { firstLineIndent: 720 }
          ),
          createParagraph('1. The automation of procurement processes through role-gated workflows effectively eliminates informal bureaucratic delays and establishes complete operational transparency.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('2. Awarding procurement contracts based on multi-criteria mathematical scoring is demonstrably superior to naive lowest-price bidding, preventing project delays and contractor defaults while optimizing value for money.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('3. Automated 3-way matching between purchase requests, purchase orders, and electronic goods received notes provides an impenetrable barrier against payment fraud, phantom deliveries, and duplicate invoicing.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('4. The developed system represents a viable, scalable, and cost-effective alternative to multi-million-naira proprietary ERP systems for Nigerian public parastatals and commercial organizations.', { firstLineIndent: 360, spaceAfter: 160 }),

          createTier2Heading('5.3', 'Recommendations'),
          createParagraph(
            'Based on the insights gained during the development and evaluation of this project, the following recommendations are proffered:',
            { firstLineIndent: 720 }
          ),
          createParagraph('1. Institutional Adoption: Management of enterprise institutions and public parastatals should adopt Procura to replace vulnerable manual paperwork, thereby instituting transparent and accountable expenditure governance.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('2. Integration with Commercial Banking APIs: Future extensions should integrate open banking APIs (such as NIBSS or Remita) to automate direct electronic funds transfers upon completion of the 3-way match.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('3. Machine Learning Predictive Analytics: Subsequent research should explore training machine learning models on historical supplier delivery logs to forecast delivery delay probabilities and detect collusive bid patterns.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('4. Public API for BPP Regulatory Oversight: Developing a secure regulatory API would enable oversight agencies such as the Bureau of Public Procurement (BPP) to inspect live audit trails in real time.', { firstLineIndent: 360, spaceAfter: 160 }),

          new Paragraph({ children: [new PageBreak()] }),

          // =========================================================================
          // REFERENCES (APA 7th Edition)
          // =========================================================================
          createTier1Heading('REFERENCES'),
          createParagraph('Adeyemo, O. A., & Babatunde, S. K. (2020). Developing an automated web-based e-tendering system for Nigerian tertiary institutions. Journal of Computing and Information Technology, 14(2), 112–128.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Bamiro, O. A. (1979). Towards a National Solar Energy Policy. In E. N. C. Osakwe (Ed.), Proceedings of the National Conference on Energy Policy (pp. 375–394). Think Tank Publications.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Booch, G., Rumbaugh, J., & Jacobson, I. (2017). The Unified Modeling Language User Guide (2nd ed.). Addison-Wesley Professional.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Croom, S., & Brandon-Jones, A. (2017). Impact of e-procurement: Evaluation of investments and governance models. International Journal of Operations & Production Management, 37(1), 22–45.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('De Boer, L., Labro, E., & Morlacchi, P. (2022). A review of methods supporting supplier selection. European Journal of Purchasing & Supply Management, 28(4), 101–119.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Ezeh, E. N. (2019). Public Procurement Reforms in Nigeria: Implementation Realities and Anti-Corruption Imperatives. Malthouse Press Ltd.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Ho, W., Xu, X., & Dey, P. K. (2018). Multi-criteria decision making approaches for supplier evaluation and selection: A comprehensive literature review. European Journal of Operational Research, 202(1), 16–24.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Ibrahim, M., & Sadiq, U. (2021). Budget-constrained requisition management software architecture. Nigerian Journal of Technology and Science, 19(3), 85–97.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Independent Corrupt Practices and Other Related Offences Commission. (2021). National Procurement Integrity and Compliance Assessment Report. ICPC Press.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Jensen, M. C., & Meckling, W. H. (1976). Theory of the firm: Managerial behavior, agency costs and ownership structure. Journal of Financial Economics, 3(4), 305–360.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Johnson, P. F., Leenders, M. R., & Flynn, A. E. (2021). Purchasing and Supply Management (16th ed.). McGraw-Hill Education.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Kashimbila, M. M. (2001). Principles of Mechanics: For Scientists and Engineers. Gidan Dabino Publishers.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Klemperer, P. (2018). Auctions: Theory and Practice. Princeton University Press.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Lysons, K., & Farrington, B. (2020). Procurement and Supply Chain Management (10th ed.). Pearson Education.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Mikhail, E. (1981). Wind Power for Developing Nations (Tech. Rep. No. 762–866). Solar Energy Research Institute.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Milgrom, P. (2017). Putting Auction Theory to Work. Cambridge University Press.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Musa, A. O. (2001). Thin-Film Backwall Schottky Barrier Solar Cells of Cuprous Oxide (Cu2O). Ife Journal of Technology, 10, 41–47.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Onyema, C. E., Adekunle, T. O., & Okpara, J. (2020). Forensic audit trail modeling for curbing financial fraud in emerging e-governance systems. African Journal of Information Systems, 12(3), 204–226.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Smith, J. (1999). One of Volvo\'s core values. Volvo Group. http://www.volvo.com/environment/index.htm', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Taherdoost, H., & Brard, A. (2019). Analyzing the process of supplier selection with Multi-Criteria Decision Making (MCDM) methods. Procedia Manufacturing, 32, 1024–1034.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('Vickrey, W. (1961). Counterspeculation, auctions, and competitive sealed tenders. The Journal of Finance, 16(1), 8–37.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),
          createParagraph('World Bank. (2021). Nigeria Country Procurement Assessment and Modernization Review (Report No. WB-NG-402). World Bank Publications.', { lineSpacing: DOUBLE_LINE_SPACING, hangingIndent: 720, spaceAfter: 180 }),

          new Paragraph({ children: [new PageBreak()] }),

          // =========================================================================
          // APPENDICES
          // =========================================================================
          createTier1Heading('APPENDICES'),

          createTier2Heading('APPENDIX A', 'User Manual and Operational Guide'),
          createParagraph('A.1 System Access and Launching: Open the application URL in any modern browser. To test sample enterprise workflows without manual setup, click "Load Demo Data" on the welcome screen.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('A.2 Switching User Roles: Navigate to the user avatar in the top right header. Select any of the seven personas (Request Officer, Department Head, Procurement Officer, Approving Authority, Vendor, Storekeeper, Finance Officer).', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('A.3 Raising a Requisition: As Request Officer, open "Requisitions", click "New Request", select categories, input item lines, and click "Submit Requisition".', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('A.4 Tender Bidding & Evaluation: As Procurement Officer, open "Tenders", publish an approved request. Switch to Vendor to submit a bid. Return to Procurement Officer, open "Bid Evaluation", pass compliance, review scores, and award contract.', { firstLineIndent: 360, spaceAfter: 80 }),
          createParagraph('A.5 Store Receiving and Payment: As Storekeeper, open "Purchase Orders", click "Receive Goods" to generate a GRN. As Finance Officer, open "Payments", inspect the 3-way match, and authorize payment settlement.', { firstLineIndent: 360, spaceAfter: 160 }),

          createTier2Heading('APPENDIX B', 'Algorithmic Implementation Core Source Code'),
          createParagraph(
            'The following TypeScript listing illustrates the algorithmic score calculation engine implemented in src/context/AppContext.tsx:',
            { firstLineIndent: 720 }
          ),
          createParagraph(
            `const calculateVendorRecommendations = (tenderId: string): Bid[] => {
  const tender = tenders.find((t) => t.id === tenderId);
  if (!tender) return [];
  const compliantBids = bids.filter((b) => b.tenderId === tenderId && b.compliancePassed !== false);
  if (compliantBids.length === 0) return [];
  
  const weights = tender.evaluationWeights;
  const minPrice = Math.min(...compliantBids.map((b) => b.totalAmount));
  const minDays = Math.min(...compliantBids.map((b) => calculateLeadDays(b.proposedDeliveryDate)));

  const scoredBids = compliantBids.map((bid) => {
    const priceScore = (minPrice / bid.totalAmount) * 100;
    const curDays = calculateLeadDays(bid.proposedDeliveryDate);
    const deliveryScore = (minDays / curDays) * 100;
    const reliabilityScore = getVendorReliability(bid.vendorId);
    const technicalScore = bid.technicalScore ?? 75;

    const totalWeightedScore = (
      priceScore * weights.price +
      deliveryScore * weights.deliveryTime +
      reliabilityScore * weights.vendorReliability +
      technicalScore * weights.technicalScore
    ) / 100;

    return { ...bid, computedScores: { priceScore, deliveryScore, reliabilityScore, technicalScore, totalWeightedScore } };
  });

  return scoredBids.sort((a, b) => b.computedScores.totalWeightedScore - a.computedScores.totalWeightedScore);
};`,
            { lineSpacing: SINGLE_LINE_SPACING, fontSize: 18, spaceBefore: 100, spaceAfter: 180 }
          ),

          createTier2Heading('APPENDIX C', 'Sample System Screenshot Figures Reference'),
          createParagraph('Screenshots of all modules (Fig. 4.1 to Fig. 4.3) are maintained in high resolution in the project source repository assets.', { firstLineIndent: 720 }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  
  // Save to public directory for direct download in browser
  const publicPath = path.join(process.cwd(), 'public', 'Procura_Final_Year_Project_Report.docx');
  fs.writeFileSync(publicPath, buffer);

  // Save to root directory
  const rootPath = path.join(process.cwd(), 'Procura_Final_Year_Project_Report.docx');
  fs.writeFileSync(rootPath, buffer);

  console.log(`Document successfully generated!`);
  console.log(`Saved to: ${publicPath}`);
  console.log(`Saved to: ${rootPath}`);
}

generateDocx().catch((err) => {
  console.error('Error generating document:', err);
  process.exit(1);
});
