/**
 * XML to HTML converter utility functions
 */

import { js_beautify as beautifyHtml } from 'js-beautify';

/**
 * Converts XML string to HTML
 * @param xmlString The XML string to convert
 * @returns HTML string representation
 */
export async function convertXmlToHtml(xmlString: string): Promise<string> {
  try {
    // Create a parser and parse the XML string
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Check for parser errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("Invalid XML format");
    }
    
    // Create an HTML structure that directly renders the XML content
    const rootElement = xmlDoc.documentElement;
    
    // First check for a table structure
    if (rootElement.tagName.toLowerCase() === 'table') {
      return convertTableXmlToHtml(rootElement);
    }
    
    // Handle other special cases
    let htmlContent = '';
    
    // Determine if this is a specific type of XML document
    const rootTagName = rootElement.tagName.toLowerCase();
    
    // For RSS/feed XML
    if (rootTagName === 'rss' || rootTagName === 'feed' || rootTagName === 'channel') {
      htmlContent = convertFeedToHtml(rootElement);
    } 
    // For SVG files
    else if (rootTagName === 'svg') {
      // For SVG, we can directly pass it through
      const serializer = new XMLSerializer();
      return serializer.serializeToString(rootElement);
    }
    // For general XML, create a styled representation
    else if (isTabularData(rootElement)) {
      htmlContent = convertToHtmlTable(rootElement);
    }
    else {
      htmlContent = createHtmlDisplay(rootElement);
    }
    
    return htmlContent;
  } catch (error) {
    console.error("Error converting XML to HTML:", error);
    throw error;
  }
}

/**
 * Special converter for standard table XML format with header, rows, cells
 */
function convertTableXmlToHtml(tableElement: Element): string {
  let html = `
    <div class="xml-table-container">
      <style>
        .xml-table-container { font-family: system-ui, sans-serif; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .table th, .table td { padding: 0.75rem; text-align: left; border: 1px solid #e2e8f0; }
        .table th { font-weight: 600; background-color: #f8fafc; }
        .table-responsive { overflow-x: auto; }
        .table tr:nth-child(even) { background-color: #f8fafc; }
      </style>
      <div class="table-responsive">
        <table class="table">
  `;
  
  // Process header if it exists
  const header = tableElement.querySelector('header');
  if (header) {
    html += '<thead><tr>';
    const columns = header.querySelectorAll('column');
    columns.forEach(col => {
      html += `<th>${col.textContent || ''}</th>`;
    });
    html += '</tr></thead>';
  }
  
  // Process rows
  const rows = tableElement.querySelectorAll('row');
  if (rows.length > 0) {
    html += '<tbody>';
    rows.forEach(row => {
      html += '<tr>';
      
      // Process cells in each row
      const cells = row.querySelectorAll('cell');
      cells.forEach(cell => {
        html += `<td>${cell.textContent || ''}</td>`;
      });
      
      html += '</tr>';
    });
    html += '</tbody>';
  }
  
  html += '</table></div></div>';
  return html;
}

/**
 * Converts XML feed elements (RSS, Atom) to HTML
 */
function convertFeedToHtml(rootElement: Element): string {
  let html = '<div class="xml-feed">';
  
  // Find title
  const title = rootElement.querySelector('title, channel > title')?.textContent || 'XML Feed';
  html += `<h1>${title}</h1>`;
  
  // Find description
  const description = rootElement.querySelector('description, channel > description, subtitle')?.textContent;
  if (description) {
    html += `<p class="feed-description">${description}</p>`;
  }
  
  // Find items/entries
  const items = Array.from(rootElement.querySelectorAll('item, entry'));
  
  if (items.length > 0) {
    html += '<div class="feed-items">';
    
    items.forEach(item => {
      const itemTitle = item.querySelector('title')?.textContent || 'Untitled';
      const itemLink = item.querySelector('link')?.textContent || '#';
      const itemDesc = item.querySelector('description, summary, content')?.textContent || '';
      
      html += `
        <div class="feed-item">
          <h2><a href="${itemLink}">${itemTitle}</a></h2>
          <div class="feed-content">${itemDesc}</div>
        </div>
      `;
    });
    
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

/**
 * Creates a proper HTML representation from XML
 */
function createHtmlDisplay(rootElement: Element): string {
  // Check if this looks like tabular data
  if (isTabularData(rootElement)) {
    return convertToHtmlTable(rootElement);
  }
  
  // Otherwise convert using semantic HTML elements
  return convertToSemanticHtml(rootElement);
}

/**
 * Determines if XML structure seems to be tabular data
 */
function isTabularData(element: Element): boolean {
  // Tables are automatically detected if:
  // 1. Element has a tag name of table, grid, or dataset
  if (['table', 'grid', 'dataset', 'records', 'rows'].includes(element.tagName.toLowerCase())) {
    return true;
  }
  
  // 2. Element contains multiple children with the same name (like rows)
  const children = Array.from(element.children);
  if (children.length <= 1) return false;
  
  const firstChildTag = children[0].tagName;
  const allSameTag = children.every(child => child.tagName === firstChildTag);
  
  // If all children have the same tag name and there are multiple children
  if (allSameTag && children.length > 1) {
    // Check if each row has multiple children (likely cells)
    const firstRowHasCells = children[0].children.length > 1;
    return firstRowHasCells;
  }
  
  return false;
}

/**
 * Converts tabular XML data to an HTML table
 */
function convertToHtmlTable(element: Element): string {
  const rows = Array.from(element.children);
  if (rows.length === 0) return '';
  
  // HTML table start with responsive wrapper
  let html = '<div class="table-responsive"><table class="table" border="1" cellpadding="8" cellspacing="0">';
  
  // Find all possible column names from all rows (in case rows have different structures)
  const allColumnNames = new Set<string>();
  rows.forEach(row => {
    Array.from(row.children).forEach(cell => {
      allColumnNames.add(cell.tagName);
    });
  });
  
  const columnNames = Array.from(allColumnNames);
  
  // Create table header from all column names
  html += '<thead><tr>';
  columnNames.forEach(colName => {
    html += `<th>${colName}</th>`;
  });
  html += '</tr></thead>';
  
  // Create table body with proper cell alignment
  html += '<tbody>';
  rows.forEach(row => {
    html += '<tr>';
    columnNames.forEach(colName => {
      const cell = row.querySelector(colName);
      const cellContent = cell ? cell.textContent || '' : '';
      html += `<td>${cellContent}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  
  return `
    <div class="xml-table-container">
      <style>
        .xml-table-container { font-family: system-ui, sans-serif; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        .table th, .table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .table th { font-weight: 600; background-color: #f8fafc; }
        .table-responsive { overflow-x: auto; }
        .table tr:nth-child(even) { background-color: #f8fafc; }
      </style>
      ${html}
    </div>
  `;
}

/**
 * Converts XML to semantic HTML
 */
function convertToSemanticHtml(element: Element): string {
  const tagName = element.tagName.toLowerCase();
  
  // Map XML tags to appropriate HTML tags when possible
  const tagMapping: Record<string, string> = {
    'title': 'h1',
    'subtitle': 'h2',
    'header': 'header',
    'footer': 'footer',
    'section': 'section',
    'paragraph': 'p',
    'p': 'p',
    'list': 'ul',
    'item': 'li',
    'link': 'a',
    'image': 'img',
    'img': 'img',
    'table': 'table',
    'row': 'tr',
    'cell': 'td',
    'heading': 'h3',
    'content': 'div',
    'div': 'div',
    'span': 'span',
    'article': 'article',
    'nav': 'nav',
    'button': 'button',
    'input': 'input'
  };
  
  const htmlTag = tagMapping[tagName] || 'div';
  
  let html = `<${htmlTag}`;
  
  // Add class for styling
  html += ` class="xml-${tagName}"`;
  
  // Handle special tag conversions
  if (htmlTag === 'a' && element.hasAttribute('href')) {
    html += ` href="${element.getAttribute('href')}"`;
  } else if (htmlTag === 'img' && element.hasAttribute('src')) {
    html += ` src="${element.getAttribute('src')}" alt="${element.getAttribute('alt') || ''}"`;
  }
  
  // Add other attributes 
  Array.from(element.attributes).forEach(attr => {
    // Skip href and src as they're already handled above
    if (attr.name !== 'href' && attr.name !== 'src') {
      html += ` data-${attr.name}="${attr.value}"`;
    }
  });
  
  html += '>';
  
  // Add content based on child elements
  if (element.childElementCount === 0) {
    // Text content
    html += element.textContent || '';
  } else {
    // Process child elements
    Array.from(element.children).forEach(child => {
      html += convertToSemanticHtml(child);
    });
  }
  
  html += `</${htmlTag}>`;
  
  // If this is the root element, add some styling
  if (element === element.ownerDocument.documentElement) {
    return `
      <div class="semantic-xml-content">
        <style>
          .semantic-xml-content { font-family: system-ui, sans-serif; line-height: 1.5; }
          .xml-title, .xml-h1 { font-size: 2rem; font-weight: bold; margin-bottom: 1rem; }
          .xml-subtitle, .xml-h2 { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.75rem; }
          .xml-heading, .xml-h3 { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; }
          .xml-paragraph, .xml-p { margin-bottom: 1rem; }
          .xml-list { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
          .xml-item { margin-bottom: 0.5rem; }
          .xml-link { color: #0077cc; text-decoration: underline; }
          .xml-image { max-width: 100%; height: auto; }
          .xml-section { margin-bottom: 2rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 0.25rem; }
          .xml-content, .xml-div { margin-bottom: 1rem; }
          .xml-article { border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1rem; }
          .xml-button { padding: 0.5rem 1rem; background-color: #f1f5f9; border: 1px solid #94a3b8; border-radius: 0.25rem; }
        </style>
        ${html}
      </div>
    `;
  }
  
  return html;
}

// Function to convert XML element to HTML element
function processXmlNode(node: Element): string {
  const tagName = node.tagName.toLowerCase();
  
  // Map XML elements to appropriate HTML elements (can be customized)
  const htmlTagMap: Record<string, string> = {
    // Default mapping preserves original tag names
  };
  
  // Choose HTML tag
  const htmlTag = htmlTagMap[tagName] || tagName;
  
  // Start tag
  let html = `<${htmlTag}`;
  
  // Add attributes
  Array.from(node.attributes).forEach(attr => {
    html += ` ${attr.name}="${attr.value}"`;
  });
  
  html += '>';
  
  // Process children
  Array.from(node.childNodes).forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      html += processXmlNode(child as Element);
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        html += text;
      }
    }
  });
  
  // Close tag
  html += `</${htmlTag}>`;
  
  return html;
}

/**
 * Formats XML string to be properly indented
 * @param xmlString XML string to format
 * @returns Formatted XML string
 */
export function formatXml(xmlString: string): string {
  if (!xmlString.trim()) return "";
  
  try {
    // Parse the XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Check for parser errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("Invalid XML format");
    }
    
    // Serialize with proper formatting
    const serializer = new XMLSerializer();
    let formatted = serializer.serializeToString(xmlDoc);
    
    // Use js-beautify for better formatting
    return formatCode(formatted, 'xml');
  } catch (error) {
    console.error("Error formatting XML:", error);
    // Return original string if formatting fails
    return xmlString;
  }
}

/**
 * Formats HTML string to be properly indented
 * @param htmlString HTML string to format
 * @returns Formatted HTML string
 */
export function formatHtml(htmlString: string): string {
  if (!htmlString.trim()) return "";
  
  try {
    return formatCode(htmlString, 'html');
  } catch (error) {
    console.error("Error formatting HTML:", error);
    return htmlString;
  }
}

/**
 * Generic code formatter using js-beautify
 */
function formatCode(code: string, type: 'html' | 'xml'): string {
  const options = {
    indent_size: 2,
    indent_with_tabs: false,
    max_preserve_newlines: 2,
    preserve_newlines: true,
    wrap_line_length: 120,
    end_with_newline: true,
    indent_inner_html: true,
  };
  
  return beautifyHtml(code, options);
}
