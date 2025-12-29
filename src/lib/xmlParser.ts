import { XMLParser } from 'fast-xml-parser';

export interface ParsedXMLData {
  rawXml: string;
  jsonData: Record<string, unknown>;
  flattenedData: Array<{ key: string; value: string; depth: number }>;
  structure: XMLNode[];
  // Certificate-specific structured data
  certificateData?: CertificateData;
}

export interface XMLNode {
  name: string;
  value?: string;
  attributes?: Record<string, string>;
  children?: XMLNode[];
  depth: number;
}

export interface CertificateData {
  companyInfo: {
    name: string;
    address: string;
    regOffice: string;
    phone: string;
    email: string;
    website: string;
    logo?: string;
  };
  documentInfo: {
    title: string;
    subtitle: string;
    regulation: string;
    pageInfo: string;
  };
  productInfo: {
    productName: string;
    packing: string;
    genericName: string;
    productCode: string;
    batchNo: string;
    actualBatchSize: string;
    packingBatchSize: string;
    sampleSize: string;
    releasedQty: string;
    mfgDate: string;
    expDate: string;
    mfgLicNo: string;
    testAsPer: string;
    testPacking: string;
    arNo: string;
    relDate: string;
    trSlipNo: string;
    trSlipDate: string;
    analysisDate: string;
    specificationNo: string;
    location: string;
    make: string;
    remarks: string;
  };
  testResults: Array<{
    srNo: string;
    test: string;
    result: string;
    specification: string;
    subTests?: Array<{
      srNo: string;
      test: string;
      result: string;
      specification: string;
    }>;
  }>;
}

export function parseXML(xmlContent: string): ParsedXMLData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true,
    trimValues: true,
  });

  const jsonData = parser.parse(xmlContent);
  const flattenedData = flattenData(jsonData);
  const structure = buildStructure(jsonData);
  const certificateData = extractCertificateData(jsonData, flattenedData);

  return {
    rawXml: xmlContent,
    jsonData,
    flattenedData,
    structure,
    certificateData,
  };
}

function extractCertificateData(
  jsonData: Record<string, unknown>,
  flattenedData: Array<{ key: string; value: string; depth: number }>
): CertificateData {
  // Helper to find value by partial key match
  const findValue = (patterns: string[]): string => {
    for (const pattern of patterns) {
      const found = flattenedData.find(
        (item) => item.key.toLowerCase().includes(pattern.toLowerCase())
      );
      if (found && found.value) return found.value;
    }
    return '';
  };

  // Extract test results from the data
  const testResults = extractTestResults(jsonData, flattenedData);

  return {
    companyInfo: {
      name: findValue(['companyName', 'company_name', 'CMPNM', 'company']) || 'COMPANY NAME',
      address: findValue(['address', 'addr', 'CMPADD', 'company_address']) || '',
      regOffice: findValue(['regOffice', 'registered_office', 'reg_office']) || '',
      phone: findValue(['phone', 'tel', 'contact']) || '',
      email: findValue(['email', 'mail']) || '',
      website: findValue(['website', 'web', 'url']) || '',
    },
    documentInfo: {
      title: 'QUALITY CONTROL DEPARTMENT',
      subtitle: 'FINISHED PRODUCT CERTIFICATE OF ANALYSIS',
      regulation: 'THE DRUG & COSMETIC ACT. 1940 & THE RULES THERE UNDER FORM-39(RULE 150-E(F))',
      pageInfo: 'Page 1 of 1',
    },
    productInfo: {
      productName: findValue(['productName', 'product_name', 'ITMNAME', 'item_name', 'name']) || '',
      packing: findValue(['packing', 'pack', 'PACK']) || '',
      genericName: findValue(['genericName', 'generic', 'GENERICNM']) || '',
      productCode: findValue(['productCode', 'product_code', 'ITMCODE', 'item_code', 'code']) || '',
      batchNo: findValue(['batchNo', 'batch_no', 'BATCHNO', 'batch', 'lotNo']) || '',
      actualBatchSize: findValue(['actualBatchSize', 'batch_size', 'BATCHSIZE']) || '',
      packingBatchSize: findValue(['packingBatchSize', 'packing_size']) || '',
      sampleSize: findValue(['sampleSize', 'sample']) || '',
      releasedQty: findValue(['releasedQty', 'released', 'quantity']) || '',
      mfgDate: findValue(['mfgDate', 'mfg_date', 'MFGDATE', 'manufacturing_date', 'mfg']) || '',
      expDate: findValue(['expDate', 'exp_date', 'EXPDATE', 'expiry', 'expiry_date']) || '',
      mfgLicNo: findValue(['mfgLicNo', 'lic_no', 'MFCLICNO', 'license']) || '',
      testAsPer: findValue(['testAsPer', 'test_as_per', 'standard']) || '',
      testPacking: findValue(['testPacking']) || '',
      arNo: findValue(['arNo', 'ar_no', 'ARNO']) || '',
      relDate: findValue(['relDate', 'release_date']) || '',
      trSlipNo: findValue(['trSlipNo', 'slip_no']) || '',
      trSlipDate: findValue(['trSlipDate', 'slip_date']) || '',
      analysisDate: findValue(['analysisDate', 'analysis_date']) || '',
      specificationNo: findValue(['specificationNo', 'spec_no', 'specification']) || '',
      location: findValue(['location', 'LOCATION', 'loc']) || '',
      make: findValue(['make', 'MAKE', 'manufacturer']) || '',
      remarks: findValue(['remarks', 'remark', 'notes']) || '',
    },
    testResults,
  };
}

function extractTestResults(
  jsonData: Record<string, unknown>,
  flattenedData: Array<{ key: string; value: string; depth: number }>
): CertificateData['testResults'] {
  const results: CertificateData['testResults'] = [];
  
  // Try to find test-related data patterns
  const testPatterns = ['test', 'result', 'specification', 'spec', 'analysis'];
  const testItems = flattenedData.filter((item) =>
    testPatterns.some((pattern) => item.key.toLowerCase().includes(pattern))
  );

  // Group by test name if possible
  const testGroups = new Map<string, { result: string; specification: string }>();
  
  for (const item of testItems) {
    const keyParts = item.key.split('.');
    const lastPart = keyParts[keyParts.length - 1].toLowerCase();
    const parentKey = keyParts.slice(0, -1).join('.');
    
    if (lastPart.includes('result') || lastPart.includes('value')) {
      const existing = testGroups.get(parentKey) || { result: '', specification: '' };
      existing.result = item.value;
      testGroups.set(parentKey, existing);
    } else if (lastPart.includes('spec') || lastPart.includes('limit')) {
      const existing = testGroups.get(parentKey) || { result: '', specification: '' };
      existing.specification = item.value;
      testGroups.set(parentKey, existing);
    } else if (lastPart.includes('test') || lastPart.includes('name')) {
      const existing = testGroups.get(item.key) || { result: '', specification: '' };
      testGroups.set(item.key, existing);
    }
  }

  // If we couldn't extract structured test data, create generic entries
  if (testGroups.size === 0) {
    // Look for any data that could be test-like
    let srNo = 1;
    for (const item of flattenedData) {
      if (item.depth >= 1 && item.value && item.value.length > 0) {
        const keyParts = item.key.split('.');
        const testName = keyParts[keyParts.length - 1]
          .replace(/([A-Z])/g, ' $1')
          .replace(/_/g, ' ')
          .trim()
          .toUpperCase();
        
        if (testName.length > 2 && testName.length < 50) {
          results.push({
            srNo: String(srNo++),
            test: testName,
            result: item.value,
            specification: '-',
          });
        }
      }
      if (srNo > 20) break; // Limit to 20 test entries
    }
  } else {
    let srNo = 1;
    for (const [key, value] of testGroups) {
      const keyParts = key.split('.');
      const testName = keyParts[keyParts.length - 1]
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim()
        .toUpperCase();
      
      results.push({
        srNo: String(srNo++),
        test: testName,
        result: value.result || '-',
        specification: value.specification || '-',
      });
    }
  }

  return results;
}

function flattenData(
  obj: unknown,
  prefix = '',
  depth = 0
): Array<{ key: string; value: string; depth: number }> {
  const result: Array<{ key: string; value: string; depth: number }> = [];

  if (obj === null || obj === undefined) {
    return result;
  }

  if (typeof obj !== 'object') {
    result.push({ key: prefix, value: String(obj), depth });
    return result;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const newPrefix = `${prefix}[${index}]`;
      result.push(...flattenData(item, newPrefix, depth));
    });
    return result;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      result.push(...flattenData(value, newPrefix, depth + 1));
    } else {
      result.push({ key: newPrefix, value: String(value ?? ''), depth });
    }
  }

  return result;
}

function buildStructure(obj: unknown, depth = 0): XMLNode[] {
  const nodes: XMLNode[] = [];

  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return nodes;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      nodes.push({
        name: `Item ${index + 1}`,
        depth,
        children: buildStructure(item, depth + 1),
      });
    });
    return nodes;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key.startsWith('@_')) {
      continue;
    }

    const node: XMLNode = {
      name: key,
      depth,
    };

    if (typeof value === 'object' && value !== null) {
      const attributes: Record<string, string> = {};
      if (typeof value === 'object') {
        for (const [attrKey, attrValue] of Object.entries(value as Record<string, unknown>)) {
          if (attrKey.startsWith('@_')) {
            attributes[attrKey.substring(2)] = String(attrValue);
          }
        }
      }
      if (Object.keys(attributes).length > 0) {
        node.attributes = attributes;
      }

      node.children = buildStructure(value, depth + 1);
    } else {
      node.value = String(value ?? '');
    }

    nodes.push(node);
  }

  return nodes;
}

export function highlightXML(xml: string): string {
  return xml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(&lt;\/?)([\w:-]+)/g, '$1<span class="xml-tag">$2</span>')
    .replace(/([\w:-]+)=(&quot;|")/g, '<span class="xml-attr">$1</span>=<span class="xml-value">"</span>')
    .replace(/(&quot;|")(?=[^<]*(&gt;|&lt;|\n|$))/g, '<span class="xml-value">"</span>')
    .replace(/("[^"]*")/g, '<span class="xml-value">$1</span>');
}
