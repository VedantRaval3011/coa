  /**
   * HTML Fixer Utility for Oracle Reports Generated COA Documents
   * Applies consistent transformations to fix layout issues
   * Supports multi-page documents
   */

  export interface FixResult {
    success: boolean;
    fixedHtml: string;
    appliedFixes: string[];
    errors: string[];
  }

  export interface FixerOptions {
    customAddress1?: string;  // First address line (PLOT NO. ...)
    customAddress2?: string;  // Second address line (REG.OFF.: ...)
    customProductName?: string;  // Product name replacement
    customGenericName?: string;  // Generic name replacement
    customRemarks?: string;      // Remarks replacement
    addDisclaimer?: boolean;  // Whether to add disclaimer after signature statement
  }

  /**
   * Fix 1: Main border - reduce height and simplify styling
   * Matches any page's main content border with height:812.0 and changes to height:620pt
   */
  function fixMainBorder(html: string): { html: string; applied: boolean; count: number } {
    // Match any main border div with height:812.0 (across all pages)
    // The top position varies per page, so we match flexibly
    const pattern = /(<div style="position:absolute;top:[\d.]+pt;left:11\.3pt;\s*width:755\.2;height:)812\.0;padding-top:803\.0;font:0pt Arial;border-width:2\.1; border-style:solid;border-color:#000000;(">)/gi;
    
    let count = 0;
    const modified = html.replace(pattern, (match, prefix, suffix) => {
      count++;
      return `${prefix}620pt;\nborder:2.1pt solid #000000;${suffix}`;
    });
    
    return { html: modified, applied: count > 0, count };
  }

  /**
   * Fix 2: Remove extra horizontal line at bottom (div around top:708pt area)
   * These appear at the end of each page
   */
  function removeExtraHorizontalLine(html: string): { html: string; applied: boolean; count: number } {
    // Match horizontal lines that appear after content (usually around 708pt per page)
    // Match pattern: position div with left:12.8pt;width:751.1 (page separator lines)
    const pattern = /<div style="position:absolute;top:[\d.]+pt;left:12\.8pt;width:751\.1;height:2\.8;padding-top:-4\.8;font:0pt Arial;border-width:1\.4 0 0 0; border-style:solid;border-color:#000000;">.*?<\/div>\r?\n?/gi;
    
    let count = 0;
    const modified = html.replace(pattern, () => {
      count++;
      return '';
    });
    
    return { html: modified, applied: count > 0, count };
  }

  /**
   * Fix 3: Fix header box border - add border-bottom: none
   * Matches header boxes across all pages (at top of each page)
   */
  function fixHeaderBorder(html: string): { html: string; applied: boolean; count: number } {
    // Match header border divs - they have height:197.0 and full border
    // Top position varies per page
    const pattern = /(<div style="position:absolute;top:[\d.]+pt;left:11\.6pt;width:754\.7;height:197\.0;padding-top:188\.0;font:0pt Arial;border-width:2\.1; border-style:solid;border-color:#000000;)(">)/gi;
    
    let count = 0;
    const modified = html.replace(pattern, (match, prefix, suffix) => {
      // Check if it already has border-bottom: none
      if (match.includes('border-bottom')) {
        return match;
      }
      count++;
      return `${prefix} border-bottom: none;${suffix}`;
    });
    
    return { html: modified, applied: count > 0, count };
  }

  /**
   * Fix 4: Fix footer position - move footer elements to appear below the main border
   * Simply adds an offset to move footer elements down below the border
   */
  function fixFooterPosition(html: string): { html: string; applied: boolean; count: number } {
    let modified = html;
    let count = 0;
    
    // Target position for footer elements relative to page start
    // We aim for 665pt because:
    // 1. Main border ends at 620pt, so 665pt is comfortably below it
    // 2. Page 2+ gets a +100pt offset. 665 + 100 = 765pt.
    // 3. Printable page height is ~792pt. 765pt < 792pt, so it fits on the page.
    // Ideally this prevents the footer from being pushed to a new empty page (Page 3)
    const TARGET_FOOTER_POS = 665;
    
    // Pattern for footer elements with id=f13 (unquoted) at any position ending in 7xx or higher per page
    const footerPattern1 = /(<span style="position:absolute;top:)(\d+)(pt;left:\d+pt" id=f13>)/gi;
    modified = modified.replace(footerPattern1, (match, prefix, top, suffix) => {
      const currentPos = parseInt(top, 10);
      const posInPage = currentPos % 812;
      if (posInPage > 700 && posInPage < 770) {
        count++;
        // Calculate page start and set to fixed target position
        const pageStart = currentPos - posInPage;
        const newPos = pageStart + TARGET_FOOTER_POS;
        return `${prefix}${newPos}${suffix}`;
      }
      return match;
    });
    
    // Pattern for footer with quoted id
    const footerPattern2 = /(<span style="position:absolute;top:)(\d+)(pt;left:\d+pt" id="f13">)/gi;
    modified = modified.replace(footerPattern2, (match, prefix, top, suffix) => {
      const currentPos = parseInt(top, 10);
      const posInPage = currentPos % 812;
      if (posInPage > 700 && posInPage < 770) {
        count++;
        const pageStart = currentPos - posInPage;
        const newPos = pageStart + TARGET_FOOTER_POS;
        return `${prefix}${newPos}${suffix}`;
      }
      return match;
    });
    
    // Pattern for page identifier (FGANLCERTQA etc.) - id=f2 at high positions
    const footerPattern3 = /(<span style="position:absolute;top:)(\d+)(pt;left:520pt" id=f2>)/gi;
    modified = modified.replace(footerPattern3, (match, prefix, top, suffix) => {
      const currentPos = parseInt(top, 10);
      const posInPage = currentPos % 812;
      if (posInPage > 700 && posInPage < 770) {
        count++;
        const pageStart = currentPos - posInPage;
        const newPos = pageStart + TARGET_FOOTER_POS;
        return `${prefix}${newPos}${suffix}`;
      }
      return match;
    });
    
    // Pattern for page identifier with quoted id
    const footerPattern4 = /(<span style="position:absolute;top:)(\d+)(pt;left:520pt" id="f2">)/gi;
    modified = modified.replace(footerPattern4, (match, prefix, top, suffix) => {
      const currentPos = parseInt(top, 10);
      const posInPage = currentPos % 812;
      if (posInPage > 700 && posInPage < 770) {
        count++;
        const pageStart = currentPos - posInPage;
        const newPos = pageStart + TARGET_FOOTER_POS;
        return `${prefix}${newPos}${suffix}`;
      }
      return match;
    });
    
    return { html: modified, applied: count > 0, count };
  }

  /**
   * Fix 5: Fix Logo Display
   * 
   * Ensures the logo is present and correctly positioned at the top-left
   * Uses the public file FGANLCERTQAd0.png
   */
  function fixLogo(html: string): { html: string; applied: boolean; count: number } {
    let count = 0;
    // Use embedded Base64 to ensure it loads even in standalone HTML
    const logoSrc = "data:image/png;base64,R0lGODlhOAE3AfcAAAAAAAAAMwAAZgAAmQAAzAAA/wAzAAAzMwAzZgAzmQAzzAAz/wBmAABmMwBmZgBmmQBmzABm/wCZAACZMwCZZgCZmQCZzACZ/wDMAADMMwDMZgDMmQDMzADM/wD/AAD/MwD/ZgD/mQD/zAD//zMAADMAMzMAZjMAmTMAzDMA/zMzADMzMzMzZjMzmTMzzDMz/zNmADNmMzNmZjNmmTNmzDNm/zOZADOZMzOZZjOZmTOZzDOZ/zPMADPMMzPMZjPMmTPMzDPM/zP/ADP/MzP/ZjP/mTP/zDP//2YAAGYAM2YAZmYAmWYAzGYA/2YzAGYzM2YzZmYzmWYzzGYz/2ZmAGZmM2ZmZmZmmWZmzGZm/2bZAGaZM2aZZmaZmWaZzGaZ/2bMAGbMM2bMZmbMmWbMzGbM/2b/AGb/M2b/Zmb/mWb/zGb//5kAAJkAM5kAZpkAmZkAzJkA/5kzAJkzM5kzZpkzmZkzzJkz/5lmAJlmM5lmZplmmZlmzJlm/5mZAJmZM5mZZpmZmZmZzJmZ/5nMAJnMM5nMZpnMmZnMzJnM/5n/AJn/M5n/Zpn/mZn/zJn//8wAAMwAM8wAZswAmcwAzMwA/8wzAMwzM8wzZswzmcwzzMwz/8xmAMxmM8xmZsxmmcxmzMxm/8yZAMyZM8yZZsyZmcyZzMyZ/8zMAMzMM8zMZszMmczMzMzM/8z/AMz/M8z/Zsz/mcz/zMz///8AAP8AM/8AZv8Amf8AzP8A//8zAP8zM/8zZv8zmf8zzP8z//9mAP9mM/9mZv9mmf9mzP9m//+ZAP+ZM/+ZZv+Zmf+ZzP+Z///MAP/MM//MZv/Mmf/MzP/M////AP//M///Zv//mf//zP///wABRAASEgCRYgDJywBbsgDJAQAQ4ACY6QBoEAAS6QAQfwCY3AAAVAAAEgC4TADpywABsgASAQAQGAAAAABUMABGEgAA2ABJiQBGAQAtAABUSABnmABlPQAgzgBtIgBnVwAgAABpmABlQABG6QByuABh6QAACACYEiH5BAAAAAAALAAAAAA4ATcBAAj/AK8JHEiwoMGDCBMKBMCwocOHECNKnEixosWLGDNq3Mixo8eLCkOKHEmyZMmPKFOqXMmypUuWJmPKnEnzpc2bOHPqxEmzp8+fBncKHUq06E6gSJPGNMq0qdOnE5VKnaoQqtWrWHlS3co1q9evYDNyHbs1rNmzZsmqVYq2rduna+MifUu3rk6BrOTqlWm3r1+VewPP/Eu4MEbBiE8CWGG4sWMABPMmnnzwseXClDMnvMzZrubPQTuLbgu69MDRqMGaXp26NdaxklcvdU2bqWzWDRnX3q31dmnewHuXZejbZPDjLsc6LG58MfLnHbs+ZK4YOmSS1qlKJNsw7m7lrqdS/+S+nLzoyeevxe5pUS1E841vO056GH536YSpn84PVKz98tcEKOCABBZoYIB+Hajgggw2aCArDEKkW1gDQugggRtdqGGBFW14YV0ehijiiNe8RWKJHJ3o4EUqYtgWgRa2OKBDF8aoIgATekWiQzlaJOOCGf2IIlhCIuhSkRSGmFKRBmbYIpE3MiVjVkqqxCSHKUZ51YkN9dgUl1YdaKOALV3pYkdgQjWiWzs6peFLZs6IUptC9SjiRF5iteCYchq1ok1xkmlllX56+BihQv0JaKBDDrphUYZ2hmhOEVLKKJxvJpppa5HipOBQjDZa5oeWksrbozc1SVSopQLpqanHbf96ZJ+rXqpTg4uumCdwAvJ55kq0QmrrTq6yVGGx1tEI65xGfjkssQcytKtGx0bbZbLKKtoYq4X++pG22Eq0LGHcdivot7iGi9G4fZUrZbDUVqpuvPL+5a6zogZZ77z0fkrus+3uy6+TApsIcFsTpjswRwkX/OLBBvsrrK+hTkqwxHTdG7G1HlXsMbJoOmyWxmgpHDLFH5OcJcYPBwqivNNSlPLM3qLL8lkqQ3lzyDT3bCzII0OsM8dL9uzzz0B/lbNVuom8stEpY7ozlUJTPXXHUM+cq684V71l0sxm/XGqV4fptZpl2yx2xa+mjW+cQRM969pst62q0me/jSXZdC///VHTbptr5tB78923y7cGXiviOsqd6+FwQ+v4U34LDu/jkF8JquKSR67n5JhnjuTmoFvOpNV3Jy665oun7mbempYu9eqjt17zu4yj7brqtAtp+rmU5/767ryfvm+BFurLOdLEC+v58IWTHr1dyzN/u/ODB9988cAnKHur10vPOvThg395xt+b3z324+eUZ/XWn79x+dzLX7/vett/f74vbx/79EO5hgAHSMACGvCABnQKAqGCQP7RpYFWgWBDYtaSBlrwggRsSgFZMUAGLpAwEvTgAZmCwRKGkCgn1OAH/5JCFY7QKCaMYQFJ+EIRJhCEK7ThDAFAQZbI8IcOxEkL/2lYQ78MkYg3RCEQY1iUI8Iwh31x4hOLuJMlMlGJSYwgFO0ixSnuMIBWLCEWs6jDDOKQimXsIBjDeMExmhErXURLHJu4xZuwEYNrJGMaBViYOdJRj3a8owXzKEAOfsWPYUEkId+YE0EOsopo1GIkH1hHSX6xkY6spEs0qUBOtkWRi1QjJjMJyE1Oco9BdAsoQ5nKlZDylD6EZSdlKUdPzrKUsXwlI21iQEMm0pZnWSUrdaLLS/KSli7EpSqBmUxG9nAjxdylKZWJyj4i8JnNFOUxo9lKlDATicbk4jfBqc2XcJOPQqRmNc+ozj0yBJsZOWc3PTJOL4azLo80Sz3jef/OdLbzlvekpDyXWBFhWkSegfwnNBM4pBmKqo3evCM9B0rQgiKTIwjdZkAfQtEfLjSjB+VgR69IkX1eBKTTlGZERkpSi7K0nBB5qQlPelGNoDSXG3UIEEUaRp6+UDc5kmk+V0pAnwqVpgrlJzc1qtKYCtWTTx2qRKKa04aY1KXRZCo6kUpVrlK1qTE16ksxctWJ3FQl3/yqUr8KVqI+law1hetSU9pWjkbVpmytqlOP6lWYpuSsf03qWz+a163idaxyHaAvcVpMuvrVrIjFaGEf21fATjWuB+1nBePK0oh6lH8TCqNnKbrWuhK2sZsVbEcDO1PJyhCtpC2tYWE7V8b/zjazlj3tEUuEzdayVrMV0U1Z95pV294Wq8Wl7RD1alepjha1iTWtbF+ZWubqFLjK1eMqnftc6k53ntHVZXWle13oGjdfeNQtZT+S3PCCt7KkHO9xkZtJraI3va4lr3oleljr4ra93Z1vScWrVbdyt7T+rG9/9Utf72b3Gov9rmgTGkQxspfB+7XifqsrVjaeN7+CHGWF8TtRAbtSwQs2cYZDfOKkMiS+o2ywfwFw2/W2mL8pfu9/CfxgHVvVkZCEr42b26gh9xiIIDayRVaA3Qu7+MUsJqZ79UtGHztZwxu+MY8DbGUa49grByYuhuX72iwfGchH7siXwTxHg57Z/8I5vgY8BwzgEs/4x1jWpy0h7ObfejTJXTbwlq88Zi9XtJbqhChAWzrd86LZzyqGLJKXqVc4Z9PSjdaygwNsZ0bXkqcNFqslfZtjR0eZ02r+Mz7bWuanqDojTP4plx9NaCWLmcSrNnGrXe1p+GoaxlzuNK5JmF9Jk3rRYabznS9bZ0AHetdGibWtoezAV6PyyYZetqA3LexIM3vYf5zxiBV9SExP+dcorrW3tz3cMx85wsEE946nbexBpxrb2U62UMgtaTEbUd7zDjSR7e3sbuPb1Kw+OFgA3mB009rgBi+0Y7nb53IbFLPfJriZV7xuER9b37m+KsbZnW6I37vdDv/PJ78NA/KMd1zZGo9zxAU+cfyunIcsvLjC8Wxekzv75TdhzKSpjfKsdBjoPKe3y4Gt7mdXHOEqJbe2r93tlK/55BJvOSsjHUKh3zwrXw/uyG/NdJ9znM1AbyG0r410oiud5A/H+tvzPXaLP3bovA57w9989YLLfef/PjY5TVr03J7774B3NcenDvW2F762H+nwzCVuQ/VKPu8Mr3chre5hSLed7kUPt5ULqXUKmzvgNE96zA//88TvO6C6Lr199b701Lt99cEFvdMF/0vYxz70iJf97dE5Z7KX/e+Td/3sq71e4Ld+u643vHuTr3wy312aQWW850+/d773Xb3U177/6UuZ6M97H/riVz23ER984RPz65g1/+LdX/eB4/4iHS6+7jPvxlOOc+4WMSHXMIAEWIAGeIADuBEIaHsMsYAO+IAIqBIL2BEQ+IAMoX8sUYHXsCsTiBEFuBMaCIEKGIErEYImaIASSIIjeIIfCBUaOBEO6IEEqBMs2IEZYYMpUYMn2BE5goM3qIMz+BQvKBEWOBGM0YI4AYQHuIIGiIEQoYRDmINLyBFQmIBDISoVSBEiCIMf6IQVMYCsUIU+FoYomIFiGIMpOIUaoYRkyIAWYYUNsYVEKIcPoYYvcYZB+INlWIJ4qIIo4YMXgYdCkYcNiIZzWIR1aIct0YdwGIh+/yiFjIiEf/iIjniGIEiIhaiIiYiIcUiJadiHa+iJHhGJeziJmviGoIgTK1CKmYiJD7GKdAgAhmiGkRiKpziKpOiKuHiLXMiINnGEp9iIh+iDnPiJvqiHkmiMtciHvDiMqXiHoliJdpiFzJiLtpiMkGiN1YiNX6iNLjGLTEiIUWiKufhegJiNy6iMwoiK3ugRPRiLobiJ1EiO5XgRwNiMFFiPtMiK3ViObmiC6DiPu+iP5oiP+diOAbmOWkiQDFiD4QiQA8mQMmiQVKiP26iLvSiR9MiChfiEUBiRGsmO/KiOgriPI+mMBLmRDBmCFbmS3BgR0aiSJWmSGAmTLlmT/f94kyx5jTo5kQXohRmZjhepkCjpki2pkwIpkkg5T+dIkpa4iDEpj0jpED3UhksJjkF5ldL4kgk5kzRJlB55lWAZlmKJgKyglGW5lWMpk08JlRQpi2U5gxQUl1jpEAVolVZplDnJlV3Zll+5lq1Il2gpmEVJmAv5lkcplH+plnSZSo3JmIZZmDnhjzbRlFLZmIBJinnJlxABi5iJk3CJmIl5jN9omZ34maBZmCfYhmyZlofJmX0phjdhmoGJmWfplNfAmtCImo4ZlbFZhbNJm7yZmkBJg7y5l6nZmsAZnAY5nG7oFMd5mFZ5iQjplid5mS65mYCJFgt4m2BBm7i5nMz/eZ1XAZ7caZ5GgZ7K+ZFJ6JtC6J5nUZdWoZ4fQZkvoRvyWZ7waRb5CZ30CZLPOJ6w6Z+i+Z3/SZ3kaZ2KuZsFeoX7yZ8EqJtZ0Z8KSpot8Y4NOogPGhYHOpkbWp8W2Z4fiqDJ2RYdKqADOpReKaIJ2hQj6hWe2aJEsYDFiYwLWpknyqIpGp8vyqA7qqJ+6aE9iqMZ6hU5WppFCqArKqQyOqNDqp9JyhIx+qNAKpsO+qQVup3nGaVAyhT2eaVcaobT2RhHqqIuGqIkSqU6qqVb2qRrWqJISorpWaZD6Rh0KpMEKqc7gaFhmpA16oJYCqJ9epB6WhQUqqFuyqODOppw/+qjFuqkgSqoamqgi8qTk/qXQQqplfqQG0imkcqpz0moN4qon8qpdlqqPpmoRFqoXnqnosqmirqEfwqZofqqAdqqqCqDY2oYh5qlsPqmS2qoveqov0qpm/qaqoqit4qruYqcxfoV3ampyaqswTqnrpqqjcqh14qsl7qqo2qtzaqaIhmaztmtNmquxFqtzDqtSlquVsqkYPisxsmqgDqsv+muQDiv4Sqpj1qv+2qX+PqtuAmh9Dqf9sqvAfuu6SqvaaqueXqXtUqWCauwvmqFs1qx4mmkB8uoE5uvCxuxGMuexnqsp9mxGVulboGmGrux2GqyOhinJAuzy7qy21qbLv/rkDQpoSZandBajOF5s0nZrgwLrv06spUKtCKLsOx6pgWrrSyblUgLkUqLrkQ7s07rqlHrsbZahherr0VLsE+LnVkbtC27tO/ZtLFapmOLs6BKtUwrsFcbtuS6tuNIq277tl+7sz57rnR7sHXriFihsm2Bn/C4MHabrQALsnybqXUxjl3bGoTbnUNrtuuptX+xk4YLtVgaoUMrtElLGH+buTY7qDXrrIzrF5gruqnrlNJqtXNauZ2bGqtbpYqbuHDrtT+LuK0htR8bu9zqsPD6j5JLuY/Bu9QqiV0ruF6ru5pbunSxgw3brMq7Ej0it79rvahrvMuLvRLrujJLvM3/+69QOrvRy70lm7eYyryLu7eeCr0X2LqFu7UU+70k+LgAIIBsWxgv66/k27Ynm77gu77x26buy7/aa6nA67/Oa7oOqLNxy5E0C8EcO7+eu8Bl27/3K6yfG7gbPJinq8Dme69RaL/da7lGm78eTMECTLYG3MEbgb/eO6EqbJNom8IHPL59G7PeqoSHy8MgHLpXEblsGJ1UiRb3+MGjO8M0rMQ9m7XtO8RjOb1ia8LPa7KXgbZSnMQ+rL/OiRrVKcVZbBeGScI4/Kg8O7foaxhCfLujcYDaqbXeuMY17BosHIC7m5IhupKi+8K7MbZanMB7/Bw5nJKBbLiDfMaFjC2H/zzHiWwdixzDjQwdjwzIkYwck/y/lawul+zCmazIm4zCnRwuR/zJGBzKyULKN2zKnozKA6zKq8zKFuzKTwzLASzLbWyAbzzJtpy5tKzDu3yqvey7v3zLwTzMqlvMxmzIvZzMvEzLzNzMsPzMyszKz0HGpxzMsSzNWojG2FyW3jnMnNvN4ny3l7uSuTzO1Hy26LzOm5yI3MzO8BzP8jzP9FzP+rzP/NzP/vzPAB3QAj3QBF3QBn3QCJ3QCr3QDN3QDv3QEB3REj3RFF3RFn3RGJ3RGr3RHN3RHv3RIB3SIj3SJF3SJn3SKJ3SKr3SLN3SLv3SMB3TMj3TNAhd0zZ90wkdEAA7";
    // Positioned at top-left (approx 15pt, 25pt) with reasonable size
    const logoHtml = `<img src="${logoSrc}" style="position:absolute;top:3pt;left:14pt;width:45pt;height:auto;z-index:1000;" alt="Logo" />`;

    // 1. Replace the standard logo span container
    // Capture the top position to preserve page location
    const pattern = /<span\s+style=["'][^"']*position:\s*absolute[^"']*top:\s*([\d.]+)pt[^"']*left:\s*[\d.]+pt[^"']*width:\s*[\d.]+pt[^"']*height:\s*[\d.]+pt[^"']*["']\s*>\s*<img[^>]*>\s*<\/span>/gi;
    
    html = html.replace(pattern, (match, topStr) => {
      count++;
      const currentTop = parseFloat(topStr);
      // If it's the first page (small top value), normalize to 3pt
      // If it's a subsequent page (large top value), keep the original position to avoid moving it to page 1
      // We assume anything > 200pt is not the main header logo of page 1
      const newTop = currentTop < 200 ? 3 : currentTop;
      
      return `<img src="${logoSrc}" style="position:absolute;top:${newTop}pt;left:14pt;width:45pt;height:auto;z-index:1000;" alt="Logo" />`;
    });

    // 2. Replace standalone/broken logo images, but preserve our new one
    // We match any img looking like the logo, but exclude the one we just inserted
    html = html.replace(
      /<img[^>]*(?:FGANLCERTQAd|logo)[^>]*>/gi,
      (match) => {
        // If it's the one we just added (check for src and unique style part), keep it
        if (match.includes(logoSrc) && match.includes('width:45pt')) {
            return match;
        }
        count++;
        return logoHtml;
      }
    );

    return { html, applied: count > 0, count };
  }




  /**
   * Fix 6: Fix column dividers - remove fixed heights that cause overflow
   * These tall column dividers appear in the test results table on each page
   */
  function fixColumnDividers(html: string): { html: string; applied: boolean; count: number } {
    let modified = html;
    let count = 0;
    
    // Match column divider divs with excessive heights (400+ pt heights)
    // Pattern: divs at left positions 210.9pt, 403.3pt, or 39.3pt with large heights
    
    // Pattern for tall column dividers (height:42X.X; patterns)
    const tallDividerPattern = /(<div style="position:absolute;top:[\d.]+pt;left:(210\.9|403\.3|39\.3)pt;width:2\.8;)height:4[\d.]+;(padding-top:4[\d.]+)/gi;
    
    modified = modified.replace(tallDividerPattern, (match, prefix, leftPos, suffix) => {
      count++;
      return `${prefix}${suffix}`;
    });
    
    return { html: modified, applied: count > 0, count };
  }

  /**
   * Fix 7: Add horizontal line below Analyst/QC Incharge row
   * Insert a line after the Analyst and Q.C. Incharge section
   */
  function addLineAfterAnalyst(html: string): { html: string; applied: boolean; count: number } {
    let modified = html;
    let count = 0;
    
    // Find the Q.C. Incharge span and add a horizontal line after it
    // Pattern: <span...>Q.C. Incharge</span>
    const qcPattern = /(<span style="position:absolute;top:([\d.]+)pt;left:487pt" id=f4>Q\.C\. Incharge<\/span>)/gi;
    
    modified = modified.replace(qcPattern, (match, fullMatch, topPos) => {
      const topValue = parseFloat(topPos);
      // Add horizontal line 15pt below the Q.C. Incharge text
      const lineTop = topValue + 15;
      count++;
      // Insert the horizontal line after Q.C. Incharge
      return `${fullMatch}
  <div style="position:absolute;top:${lineTop}pt;left:13.3pt;width:749.8;height:2.8;padding-top:-4.8;font:0pt Arial;border-width:1.4 0 0 0; border-style:solid;border-color:#000000;"><table></table></div>`;
    });
    
    return { html: modified, applied: count > 0, count };
  }

  /**
   * Fix 8: Offset page 2+ content downward for proper print pagination
   * Oracle Reports uses ~792pt page height. Page 2 content starts at 792pt.
   * We need to push ALL page 2 content down by the SAME amount to keep it together
   */
  function offsetSubsequentPages(html: string): { html: string; applied: boolean; count: number } {
    let modified = html;
    let count = 0;
    
    // Page boundary - content starting at or after this is page 2
    const PAGE_BOUNDARY = 791;
    // Fixed offset to push page 2 content down so it lands on printed page 2
    const PAGE_OFFSET = 100;
    
    // Match position:absolute with top values
    const positionPattern = /(\bposition:\s*absolute\s*;\s*top:\s*)(\d+(?:\.\d+)?)(pt)/gi;
    
    modified = modified.replace(positionPattern, (match, prefix, topValue, suffix) => {
      const currentTop = parseFloat(topValue);
      
      // All content at or after 791pt is page 2 - add the SAME offset to keep elements together
      if (currentTop >= PAGE_BOUNDARY) {
        // Calculate which page (1 = page 2, 2 = page 3, etc.)
        const pageNum = Math.floor(currentTop / PAGE_BOUNDARY);
        const newTop = currentTop + (PAGE_OFFSET * pageNum);
        count++;
        return `${prefix}${newTop}${suffix}`;
      }
      
      return match;
    });
    
    return { html: modified, applied: count > 0, count };
  }

  /**
   * Fix 9: Fix broken micro symbol (µ)
   * Replaces broken/garbled micro symbol characters with proper µ
   * The original µ character often gets corrupted to replacement character (�) or other garbage
   */
  function fixMicroSymbol(html: string): { html: string; applied: boolean; count: number } {
    let modified = html;
    let count = 0;
    
    // Match patterns where µ is broken - typically appears as:
    // - "25  m" (two spaces where µ was)
    // - "25 �m" (replacement character)
    // - "25 [garbage]m" (some corrupted bytes)
    // We look for: number + space + any non-word chars + "m" followed by end/space/tag
    
    // Pattern 1: Match number followed by whitespace/garbage and then just "m"
    // The [^\w\s<>]* captures any broken/special characters
    const pattern1 = /(\d+)\s+[^\w\s<>]*m(?=\s|<|$|\.)/gi;
    modified = modified.replace(pattern1, (match, num) => {
      count++;
      return `${num} µm`;
    });
    
    // Pattern 2: Match "than X  m" or "than X �m" specifically for particle size specs
    const pattern2 = /(than\s+\d+)\s+[^\w<>]*m(?=\s|<|$|\.)/gi;
    modified = modified.replace(pattern2, (match, prefix) => {
      count++;
      return `${prefix} µm`;
    });
    
    // Pattern 3: Replace the Unicode replacement character (U+FFFD) before 'm'
    // This is the diamond question mark: �
    modified = modified.replace(/\uFFFDm/g, () => {
      count++;
      return 'µm';
    });
    
    // Pattern 4: Replace any variant of broken mu (common encoding issues)
    modified = modified.replace(/[\x00-\x1F\x7F-\x9F]m(?=\s|<|$)/g, () => {
      count++;
      return 'µm';
    });
    
    // Pattern 5: Replace Windows-1252 micro sign (0xB5 = 181)
    modified = modified.replace(/\xB5/g, 'µ');
    
    // Pattern 6: Replace any single weird character followed by 'm' after a space
    // This catches cases like "25 Xm" where X is any non-alphanumeric
    modified = modified.replace(/(\d+\s+)[^\w\s]m(?=\s|<|\.)/gi, (match, prefix) => {
      count++;
      return `${prefix}µm`;
    });
    
    // Pattern 7: Ensure HTML has proper charset for displaying µ
    // Add meta charset if not present
    if (!modified.includes('charset') && modified.includes('<head>')) {
      modified = modified.replace('<head>', '<head>\n<meta charset="UTF-8">');
      count++;
    } else if (!modified.includes('charset') && modified.includes('<html>')) {
      modified = modified.replace('<html>', '<html>\n<head><meta charset="UTF-8"></head>');
      count++;
    }
    
    return { html: modified, applied: count > 0, count };
  }

/**
 * Fix 10: Replace address lines with custom address
 * Replaces the PLOT NO. and REG.OFF. address lines
 * Preserves original positioning
 */
function replaceAddress(html: string, address1?: string, address2?: string): { html: string; applied: boolean; count: number } {
  let modified = html;
  let count = 0;
  
  if (address1) {
    // Find and replace the first address line (PLOT NO. ...) 
    // Pattern matches: PLOT NO. followed by any characters (the full address)
    const pattern1 = /<span style="position:absolute;top:([\d.]+)pt;left:([\d.]+)pt"([^>]*)>\s*PLOT NO\.[^<]+<\/span>/gi;
    
    modified = modified.replace(pattern1, (match, topPos, leftPos, attributes) => {
      count++;
      // Extract id attribute if present to preserve font styling
      const idMatch = attributes.match(/id=["']?([^"'\s>]+)["']?/);
      const idAttr = idMatch ? ` id="${idMatch[1]}"` : '';
      
      // Center the address: use full width of valid area (approx 755pt) and text-align center
      // Aligned with header box which is at left:11.6pt
      return `<span style="position:absolute;top:${topPos}pt;left:11.6pt;width:580pt;text-align:center;"${idAttr}>${address1}</span>`;
    });
  }
  
  if (address2) {
    // Find and replace the second address line (REG.OFF.: ...)
    const pattern2 = /<span style="position:absolute;top:([\d.]+)pt;left:([\d.]+)pt"([^>]*)>\s*REG\.OFF\.[^<]+<\/span>/gi;
    
    modified = modified.replace(pattern2, (match, topPos, leftPos, attributes) => {
      count++;
      // Extract id attribute if present to preserve font styling
      const idMatch = attributes.match(/id=["']?([^"'\s>]+)["']?/);
      const idAttr = idMatch ? ` id="${idMatch[1]}"` : '';
      
      // Center the address
      return `<span style="position:absolute;top:${topPos}pt;left:11.6pt;width:580pt;text-align:center;"${idAttr}>${address2}</span>`;
    });
  }
  
  return { html: modified, applied: count > 0, count };
}

  /**
   * Fix 10: Replace product name with custom name
   * Replaces the product name in the Product Name field
   * Only targets the span at the specific vertical position (145-148pt) where Product Name appears
   */
  function replaceProductName(html: string, productName?: string): { html: string; applied: boolean; count: number } {
    if (!productName) {
      return { html, applied: false, count: 0 };
    }
    
    let modified = html;
    let count = 0;
    // Store the original product name found on Page 1 to identify it on subsequent pages
    let originalName: string | null = null;
    
    // Match product name pattern across ALL pages
    // We specifically target spans at left:108pt (Product Name column) and id=f2
    // We capture top position to identify Page 1 (144-150pt)
    const pattern = /(<span style="position:absolute;top:([\d.]+)pt;left:108pt" id=f2>)([^<]+)(  <\/span>|<\/span>)/gi;
    
    modified = modified.replace(pattern, (match, prefix, topStr, currentText, suffix) => {
      const top = parseFloat(topStr);
      const text = currentText.trim();
      
      // Page 1 Product Name is always at approx 145-146pt
      const isPage1 = top >= 144 && top < 155;
      
      if (isPage1) {
        originalName = text;
        count++;
        return `${prefix}${productName}${suffix}`;
      }
      
      // For subsequent pages, replace if the text matches the original product name
      // This ensures we don't accidentally replace other fields like "Packing" or "Batch No"
      if (originalName && text === originalName) {
        count++;
        return `${prefix}${productName}${suffix}`;
      }
      
      return match;
    });
    
    return { html: modified, applied: count > 0, count };
  }

  /**
   * Fix 11: Add disclaimer to signature statement
   * Appends "This is generated as per user requirement" to the existing signature statement
   */
  function addDisclaimer(html: string): { html: string; applied: boolean; count: number } {
    let modified = html;
    let count = 0;
    
    // Find the signature statement and append disclaimer within the quotes
    // Original: "This computer generated certificate of analysis is valid without  signature"
    // New: "This computer generated certificate of analysis is valid without signature. This is generated as per user requirement"
    const pattern = /This computer generated certificate of analysis is valid without  signature&quot;/gi;
    
    modified = modified.replace(pattern, () => {
      count++;
      return `This document has been generated as per client requirement &quot;`;
    });
    
    return { html: modified, applied: count > 0, count };
  }

  /**
   * Fix 13: Remove stray artifacts on the far left
   * Removes elements positioned at left < 10pt which are usually printing artifacts
   */
  function removeLeftArtifacts(html: string): { html: string; applied: boolean; count: number } {
    let modified = html;
    let count = 0;

    // Pattern for any absolute element with left less than 10pt
    // Matches style="... left: Xpt" or "left:Xpt" where X is < 10 (single digit)
    // Uses [\s\S]*? to match content across newlines (critical for divs containing nested elements like <hr>)
    const pattern = /<(div|span)[^>]*style=["'][^"']*left:\s*[0-9](\.\d+)?pt[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi;

    modified = modified.replace(pattern, (match) => {
      count++;
      return ''; 
    });

    return { html: modified, applied: count > 0, count };
  }

  /**
   * Fix 10b: Replace Generic Name
   * Similar to Product Name, finds the Generic Name field and updates it across all pages
   */
  function replaceGenericName(html: string, genericName?: string): { html: string; applied: boolean; count: number } {
    if (!genericName) return { html, applied: false, count: 0 };
    
    let modified = html;
    let count = 0;
    
    // 1. Find the "Generic Name" label to determine the Top position
    const labelMatch = modified.match(/<span[^>]*top:([\d.]+)pt[^>]*>\s*Generic\s*Name\s*<\/span>/i);
    if (!labelMatch) {
        return { html, applied: false, count: 0 };
    }
    
    const labelTop = parseFloat(labelMatch[1]);
    let originalValue = '';

    // 2. Identify the original generic name value on Page 1
    // Scan for all spans at left:108pt using a flexible regex for attributes
    // Matches standard Oracle Reports format: style="..." ... >
    const potentialValues = Array.from(modified.matchAll(/<span style="position:absolute;top:([\d.]+)pt;left:108pt"[^>]*>([^<]+)/gi));
    
    for (const match of potentialValues) {
        const valTop = parseFloat(match[1]);
        // Check vertical alignment (within 5pt tolerance)
        if (Math.abs(valTop - labelTop) <= 5) {
            originalValue = match[2].trim();
            break;
        }
    }
    
    if (!originalValue) return { html, applied: false, count: 0 };

    // 3. Replace all instances of that original value in the Generic Name column (left:108pt)
    // Relaxed pattern: matches left:108pt and captures the rest of the tag until >
    // We handle the closing tag flexibly too
    const pattern = /(<span style="position:absolute;top:[\d.]+pt;left:108pt"[^>]*>)([^<]+)(<\/span>)/gi;

    modified = modified.replace(pattern, (match, openTag, text, closeTag) => {
        const trimmedText = text.trim();
        // Replace if it matches the original Generic Name found on Page 1
        // We also check if it contains the original value (in case of trailing spaces inside the match)
        if (trimmedText === originalValue) {
            count++;
            return `${openTag}${genericName}${closeTag}`;
        }
        return match;
    });

    return { html: modified, applied: count > 0, count };
  }

  /**
 * Fix 14: Replace/Add Remarks
 * Finds the Remarks label and updates the content on ALL pages
 * Improved to handle multi-page documents more reliably
 */
function replaceRemarks(html: string, remarks?: string): { html: string; applied: boolean; count: number } {
  if (remarks === undefined) return { html, applied: false, count: 0 };
  
  let modified = html;
  let count = 0;
  
  // Find ALL "Remarks" labels across all pages
  const labelMatches = Array.from(modified.matchAll(/<span[^>]*style="position:absolute;top:([\d.]+)pt;left:([\d.]+)pt"[^>]*id=([^>]*)>([^<]*Remarks[^<]*)<\/span>/gi));
  
  if (labelMatches.length === 0) {
      // Try without id attribute
      const labelMatchesNoId = Array.from(modified.matchAll(/<span[^>]*style="position:absolute;top:([\d.]+)pt;left:([\d.]+)pt"[^>]*>([^<]*Remarks[^<]*)<\/span>/gi));
      if (labelMatchesNoId.length === 0) {
          return { html, applied: false, count: 0 };
      }
      
      // Process each Remarks label found
      for (const labelMatch of labelMatchesNoId) {
          const labelTop = parseFloat(labelMatch[1]);
          const labelLeft = parseFloat(labelMatch[2]);
          
          // Find the value span for this specific Remarks label
          // It should be on the same line (similar top value) but to the right
          const valueSpanPattern = /<span style="position:absolute;top:([\d.]+)pt;left:([\d.]+)pt"([^>]*)>([^<]*)<\/span>/gi;
          let valueSpanFound = false;
          
          modified = modified.replace(valueSpanPattern, (match, topStr, leftStr, attrs, content) => {
              const top = parseFloat(topStr);
              const left = parseFloat(leftStr);
              
              // Check if this span is on the same line as the Remarks label and to the right
              if (Math.abs(top - labelTop) <= 2 && left > labelLeft + 20 && content.trim() !== ':') {
                  // This is likely the value span for this Remarks label
                  if (!valueSpanFound) {
                      valueSpanFound = true;
                      count++;
                      return `<span style="position:absolute;top:${topStr}pt;left:${leftStr}pt"${attrs}>${remarks}</span>`;
                  }
              }
              
              return match;
          });
      }
      
      return { html: modified, applied: count > 0, count };
  }
  
  // Process each Remarks label found (with id attribute)
  for (const labelMatch of labelMatches) {
      const labelTop = parseFloat(labelMatch[1]);
      const labelLeft = parseFloat(labelMatch[2]);
      
      // Find the colon span first (it's between the label and the value)
      let colonLeft = 0;
      const colonPattern = /<span style="position:absolute;top:([\d.]+)pt;left:([\d.]+)pt"[^>]*>:<\/span>/gi;
      const colonMatches = Array.from(modified.matchAll(colonPattern));
      
      for (const colonMatch of colonMatches) {
          const colonTop = parseFloat(colonMatch[1]);
          const colonLeftPos = parseFloat(colonMatch[2]);
          
          if (Math.abs(colonTop - labelTop) <= 2 && colonLeftPos > labelLeft) {
              colonLeft = colonLeftPos;
              break;
          }
      }
      
      // Find the value span for this specific Remarks label
      // It should be on the same line (similar top value) but to the right of the colon
      const valueSpanPattern = /<span style="position:absolute;top:([\d.]+)pt;left:([\d.]+)pt"([^>]*)>([^<]*)<\/span>/gi;
      let valueSpanFound = false;
      
      modified = modified.replace(valueSpanPattern, (match, topStr, leftStr, attrs, content) => {
          const top = parseFloat(topStr);
          const left = parseFloat(leftStr);
          
          // Check if this span is on the same line as the Remarks label and to the right of the colon
          const minLeft = colonLeft > 0 ? colonLeft : labelLeft + 20;
          
          if (Math.abs(top - labelTop) <= 2 && left > minLeft && content.trim() !== ':' && !valueSpanFound) {
              // This is likely the value span for this Remarks label
              valueSpanFound = true;
              count++;
              return `<span style="position:absolute;top:${topStr}pt;left:${leftStr}pt"${attrs}>${remarks}</span>`;
          }
          
          return match;
      });
  }
  
  return { html: modified, applied: count > 0, count };
}

  /**
   * Extract current values from the HTML to populate default customization options
   */
  export function extractCurrentValues(html: string) {
    // Extract Address 1 - match PLOT NO with optional dot, colon, or spaces
    const address1Match = html.match(/PLOT\s*NO\.?\s*[^<]+/i);
    const address1 = address1Match ? address1Match[0].trim() : '';

    // Extract Address 2 - match REG. OFF with optional dots, colons, or spaces
    const address2Match = html.match(/REG\.?\s*OFF\.?\s*:[^<]+|REG\.?\s*OFF\.?\s*[^<]+/i);
    const address2 = address2Match ? address2Match[0].trim() : '';

    // Extract Product Name - match the span at the specific vertical position
    // We try to match the content inside the span at top:14[4-8]pt
    const productNameMatch = html.match(/<span style="position:absolute;top:14[4-8]pt;left:108pt"[^>]*>([^<]+)/i);
    const productName = productNameMatch ? productNameMatch[1].trim() : '';

    // Extract Generic Name component
    // 1. Find the label position
    let genericName = '';
    const genericNameLabelMatch = html.match(/<span[^>]*top:([\d.]+)pt[^>]*>\s*Generic\s*Name\s*<\/span>/i);
    
    if (genericNameLabelMatch) {
        const labelTop = parseFloat(genericNameLabelMatch[1]);
        
        // 2. Find closest value at left:108pt
        // We scan for all spans at left:108pt and find the one closest vertically to the label
        const potentialValues = html.matchAll(/<span style="position:absolute;top:([\d.]+)pt;left:108pt"[^>]*>([^<]+)/gi);
        
        for (const match of potentialValues) {
            const valTop = parseFloat(match[1]);
            // Check vertical alignment (within 5pt tolerance to account for different fonts/alignments)
            if (Math.abs(valTop - labelTop) <= 5) {
                genericName = match[2].trim();
                break;
            }
        }
    }

    // Extract Remarks
    let remarks = '';
    
    // Strategy: Find "Remarks" keyword, then find value at right
    // 1. Find matches for "Remarks" in a span
    const remarksLabelMatch = html.match(/(<span[^>]*top:([\d.]+)pt;left:([\d.]+)pt[^>]*>)([^<]*Remarks[^<]*)(<\/span>)/i);
    
    if (remarksLabelMatch) {
        const labelTop = parseFloat(remarksLabelMatch[2]);
        const labelLeft = parseFloat(remarksLabelMatch[3]);
        const innerText = remarksLabelMatch[4];
        
        // Check if value is already in this span (e.g. "Remarks : Value")
        // Remove "Remarks" and ":" and whitespace
        const possibleValue = innerText.replace(/Remarks/i, '').replace(/:/g, '').trim();
        
        if (possibleValue.length > 0) {
            remarks = possibleValue;
        } else {
            // Value is in a separate span
            // Find spans on same line, to the right
            const potentialValues = Array.from(html.matchAll(/<span style="position:absolute;top:([\d.]+)pt;left:([\d.]+)pt"[^>]*>([^<]*)<\/span>/gi));
            
            let bestCandidate = '';
            let minDist = 9999;
            
            for (const match of potentialValues) {
                const valTop = parseFloat(match[1]);
                const valLeft = parseFloat(match[2]);
                const content = match[3].trim();
                
                // Same line (approx), to the right of label
                if (Math.abs(valTop - labelTop) <= 5 && valLeft > labelLeft) {
                    // Ignore the colon span if it exists separately
                    if (content === ':' || content === '') {
                         // If it's a colon, skip
                         // If it's empty, it MIGHT be the value placeholder, keep it as candidate if we don't find text
                    }
                    
                    // We prefer spans with text
                    // The value span is usually the one with id=f2 (data) vs f4 (headers), but we can't search by ID easily without parsing attributes accurately
                    // Heuristic: The value is strictly to the right of the colon. Colon is usually at +40pt from Remarks.
                    // Remarks @ 16pt. Colon @ 56pt. Value @ 63pt.
                    
                    if (content !== ':' && valLeft > labelLeft + 10) {
                         // If we find text, take it
                         if (content.length > 0) {
                             remarks = content;
                             break;
                         }
                    }
                }
            }
        }
    }

    return { address1, address2, productName, genericName, remarks };
  }

  /**
   * Main function - applies all fixes to an HTML document
   * Now supports multi-page documents with count tracking
   * Accepts optional FixerOptions for custom replacements
   */
  export function fixHtmlDocument(html: string, options?: FixerOptions): FixResult {
    const appliedFixes: string[] = [];
    const errors: string[] = [];
    let currentHtml = html;
    
    try {
      // Apply Fix 1: Main border
      const fix1 = fixMainBorder(currentHtml);
      currentHtml = fix1.html;
      if (fix1.applied) appliedFixes.push(`Fixed main border height (812pt → 620pt) [${fix1.count} instance(s)]`);
      
      // Apply Fix 2: Remove extra horizontal line
      const fix2 = removeExtraHorizontalLine(currentHtml);
      currentHtml = fix2.html;
      if (fix2.applied) appliedFixes.push(`Removed extra horizontal line(s) [${fix2.count} instance(s)]`);
      
      // Apply Fix 3: Header border
      const fix3 = fixHeaderBorder(currentHtml);
      currentHtml = fix3.html;
      if (fix3.applied) appliedFixes.push(`Fixed header border(s) (added border-bottom: none) [${fix3.count} instance(s)]`);
      
      // Apply Fix 4: Footer position
      const fix4 = fixFooterPosition(currentHtml);
      currentHtml = fix4.html;
      if (fix4.applied) appliedFixes.push(`Fixed footer position(s) (754pt → 780pt) [${fix4.count} instance(s)]`);
      
      // Apply Fix 5: Logo Display
      const fix5 = fixLogo(currentHtml);
      currentHtml = fix5.html;
      if (fix5.applied) appliedFixes.push(`Fixed logo display [${fix5.count} instance(s)]`);
      
      // Apply Fix 6: Column dividers
      const fix6 = fixColumnDividers(currentHtml);
      currentHtml = fix6.html;
      if (fix6.applied) appliedFixes.push(`Fixed column divider height(s) [${fix6.count} instance(s)]`);
      
      
      // Apply Fix 7: Add line below Analyst section
      const fix7 = addLineAfterAnalyst(currentHtml);
      currentHtml = fix7.html;
      if (fix7.applied) appliedFixes.push(`Added horizontal line below Analyst/QC section [${fix7.count} instance(s)]`);
      
      // Apply Fix 9: Fix broken micro symbol (µ) - must run before offset
      const fix9 = fixMicroSymbol(currentHtml);
      currentHtml = fix9.html;
      if (fix9.applied) appliedFixes.push(`Fixed micro symbol (µm) [${fix9.count} instance(s)]`);
      
      // ============================================================
      // TEXT REPLACEMENT FIXES - Must run BEFORE page offset (Fix 8)
      // These rely on consistent page positioning (812pt per page)
      // ============================================================
      
      // Apply Fix 10: Custom address replacement (if provided)
      if (options?.customAddress1 || options?.customAddress2) {
        const fix10 = replaceAddress(currentHtml, options.customAddress1, options.customAddress2);
        currentHtml = fix10.html;
        if (fix10.applied) appliedFixes.push(`Replaced address line(s) [${fix10.count} instance(s)]`);
      }
      
      // Apply Fix 11: Custom product name replacement (if provided)
      if (options?.customProductName) {
        const fix11 = replaceProductName(currentHtml, options.customProductName);
        currentHtml = fix11.html;
        if (fix11.applied) appliedFixes.push(`Replaced product name(s) [${fix11.count} instance(s)]`);
      }

      // Apply Fix 11b: Custom generic name replacement (if provided)
      if (options?.customGenericName) {
        const fix11b = replaceGenericName(currentHtml, options.customGenericName);
        currentHtml = fix11b.html;
        if (fix11b.applied) appliedFixes.push(`Replaced generic name(s) [${fix11b.count} instance(s)]`);
      }

      // Apply Fix 11c: Custom remarks replacement (if provided)
      // We process this even if empty string is passed, to allow clearing remarks if needed,
      // but usually we check if it is defined.
      if (options?.customRemarks !== undefined) {
         const fix11c = replaceRemarks(currentHtml, options.customRemarks);
         currentHtml = fix11c.html;
         if (fix11c.applied) appliedFixes.push(`Updated remarks [${fix11c.count} instance(s)]`);
      }
      
      // ============================================================
      // END TEXT REPLACEMENT FIXES
      // ============================================================
      
      // Apply Fix 8: Offset page 2+ content for proper print pagination
      // MUST run AFTER text replacements since offset breaks page position math
      const fix8 = offsetSubsequentPages(currentHtml);
      currentHtml = fix8.html;
      if (fix8.applied) appliedFixes.push(`Offset page 2+ content for print pagination [${fix8.count} element(s)]`);
      
      // Apply Fix 12: Add disclaimer (if enabled)
      if (options?.addDisclaimer) {
        const fix12 = addDisclaimer(currentHtml);
        currentHtml = fix12.html;
        if (fix12.applied) appliedFixes.push(`Added user requirement disclaimer [${fix12.count} instance(s)]`);
      }
      
      // Apply Fix 13: Remove left artifacts (stray dashes)
      const fix13 = removeLeftArtifacts(currentHtml);
      currentHtml = fix13.html;
      if (fix13.applied) appliedFixes.push(`Removed left margin artifacts [${fix13.count} instance(s)]`);
      
      
      return {
        success: true,
        fixedHtml: currentHtml,
        appliedFixes,
        errors
      };
    } catch (error) {
      errors.push(`Error during processing: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        fixedHtml: html,
        appliedFixes,
        errors
      };
    }
  }

  /**
   * Get filename with _fixed suffix
   */
  export function getFixedFilename(originalName: string): string {
    const dotIndex = originalName.lastIndexOf('.');
    if (dotIndex === -1) {
      return `${originalName}_fixed.htm`;
    }
    const baseName = originalName.substring(0, dotIndex);
    return `${baseName}_fixed.htm`;
  }
