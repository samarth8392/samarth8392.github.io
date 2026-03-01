---
layout: page
title: Publications
subtitle: Research publications and academic contributions
---

<!-- Include custom CSS -->
<link rel="stylesheet" href="{{ '/assets/css/publications.css' | relative_url }}">

<div class="publications-container">
    <!-- Header Stats -->
    <div class="text-center mb-4">
        <p class="text-muted">
            <span id="publication-count">0 Publications</span> • 
            <span id="total-citations">0 Total Citations</span>
            <br>
            <br>
            <a href="https://scholar.google.com/citations?user=kL0KaxQAAAAJ&hl=en" target="_blank" class="scholar-badge">🎓 My Google Scholar Profile</a>
        </p>
    </div>
    <!-- Loading State -->
    <div id="loading" class="text-center" style="display: none;">
        <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Loading...</span>
        </div>
        <p class="mt-2 text-muted">Loading publications...</p>
    </div>
    <!-- Publications List -->
    <div id="publications-list"></div>
    <!-- Empty State -->
    <div id="empty-state" class="text-center">
        <div style="font-size: 4rem; color: #6c757d;"></div>
        <p class="text-muted">Loading your research publications...</p>
    </div>
</div>

<!-- Altmetric Script -->
<script type='text/javascript' src='https://d1bxh8uas1mnw7.cloudfront.net/assets/embed.js'></script>

<script>
// Add your DOIs here
const myDOIs = [
    '10.1111/mec.70014', // Genomic Evaluation of Assisted Gene Flow Options in an ...
    '10.1136/jitc-2025-SITC2025.0038', // 38 Liquid biopsy detects treatment resistance ...
    '10.1093/jhered/esaf088', // A multifaceted approach to identify disease response ...
    '10.1055/s-0045-1803100', // Evaluation of Targeted and Immunotherapeutic Approaches ...
    '10.1101/2025.11.25.690472', // Phylogenomic and comparative genome analysis of the Juglandaceae ...
    '10.1111/mec.16051', // The long‐standing significance of genetic diversity in ...
    '10.1111/eva.13216', // Genetic load has potential in large populations but is ...
    '10.1016/j.jhazmat.2015.08.055', // A study on metabolic prowess of Pseudomonas sp. RPT 52 ...
    '10.1093/evolut/qpac061', // An evolutionary perspective on genetic load in small, isolated ...
    '10.1073/pnas.2303043120', // Functional genomic diversity is correlated with neutral ...
    '10.1007/s10592-019-01218-9', // Evidence of genetic erosion in a peripheral population ...
    '10.1186/s12862-019-1435-y', // Immunogenetic response of the bananaquit in the face ...
    '10.1038/s41598-019-39793-z', // Microsatellite Borders and Micro-sequence Conservation ...
    '10.3390/d14070577', // The First Complete Chloroplast Genome Sequence and ...
    '10.1073/pnas.2320040121', // Rapid vertebrate speciation via isolation, bottlenecks, and ...
    '10.1371/journal.pcbi.1012566', // Detectability of runs of homozygosity is influenced by analysis ...
    '10.1007/s10709-019-00081-3', // Episodic positive diversifying selection on key immune system ...
    '10.1186/s12862-023-02191-1', // Genetic approaches reveal a healthy population and an ...
    '10.1111/mec.17210', // Genetic mechanisms and biological processes underlying ...
    '10.1186/s12870-025-07678-1', // Comparative analysis of butternut (Juglans cinerea) and Japanese ...
    '10.22541/au.168371288.85881657/v1', // Conservation genomics of California towhee (Melozone ...
    

];

// Google Scholar profile URL (optional)
const GOOGLE_SCHOLAR_URL = 'https://scholar.google.com/citations?user=kL0KaxQAAAAJ&hl=en&oi=ao';

let publications = [];
let isLoading = false;

async function fetchWithRetry(url, options = {}, retries = 2, timeoutMs = 8000) {
    let lastError = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return response;
            }

            if (response.status === 404) {
                return null;
            }

            if (response.status === 429 || response.status >= 500) {
                lastError = new Error(`Crossref temporary error (${response.status})`);
            } else {
                return null;
            }
        } catch (error) {
            clearTimeout(timeoutId);
            lastError = error;
        }

        if (attempt < retries) {
            const backoffMs = 500 * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
    }

    throw lastError || new Error('Request failed');
}

async function fetchPublication(doi) {
    const doiUrl = `https://doi.org/${doi}`;

    try {
        const encodedDoi = encodeURIComponent(doi);
        const response = await fetchWithRetry(`https://api.crossref.org/works/${encodedDoi}`);

        // DOI not found or non-retriable response: show a graceful fallback card
        if (!response) {
            return {
                title: 'Publication metadata unavailable',
                authors: [],
                journal: 'Unknown journal',
                year: 'n.d.',
                volume: '',
                issue: '',
                pages: '',
                publisher: '',
                doi: doi,
                url: doiUrl,
                type: 'journal-article',
                originalDoi: doi,
                citationCount: null
            };
        }

        const data = await response.json();
        const work = data.message;

        return {
            title: work.title?.[0] || 'Title not available',
            authors: work.author?.map(author => 
                `${author.given || ''} ${author.family || ''}`.trim()
            ) || [],
            journal: work['container-title']?.[0] || 'Journal not available',
            year: work.published?.['date-parts']?.[0]?.[0] || 'Year not available',
            volume: work.volume || '',
            issue: work.issue || '',
            pages: work.page || '',
            publisher: work.publisher || '',
            doi: work.DOI || doi,
            url: work.URL || doiUrl,
            type: work.type || 'journal-article',
            originalDoi: doi,
            citationCount: work['is-referenced-by-count'] ?? null
        };
    } catch (error) {
        console.warn(`Crossref fetch failed for DOI ${doi}:`, error);
        return {
            title: 'Publication metadata unavailable',
            authors: [],
            journal: 'Unknown journal',
            year: 'n.d.',
            volume: '',
            issue: '',
            pages: '',
            publisher: '',
            doi: doi,
            url: doiUrl,
            type: 'journal-article',
            originalDoi: doi,
            citationCount: null
        };
    }
}

function formatAuthors(authors, highlightName = 'Singh, N') {
    if (authors.length === 0) return 'Authors not available';
    
    const formattedAuthors = authors.map(author => {
        // Customize this logic to match your name variations
        if (author.includes('Singh') && author.includes('N')) {
            return `<strong>${author}</strong>`;
        }
        return author;
    });
    
    if (formattedAuthors.length === 1) return formattedAuthors[0];
    if (formattedAuthors.length === 2) return `${formattedAuthors[0]} and ${formattedAuthors[1]}`;
    if (formattedAuthors.length <= 5) {
        return `${formattedAuthors.slice(0, -1).join(', ')}, and ${formattedAuthors[formattedAuthors.length - 1]}`;
    }
    return `${formattedAuthors.slice(0, 3).join(', ')}, et al.`;
}

function createPublicationCard(pub) {
    const scholarSearchUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title)}`;
    
    return `
        <div class="publication-card">
            <h3 class="publication-title">${pub.title}</h3>
            
            <div class="publication-authors">
                ${formatAuthors(pub.authors)}
            </div>
            
            <div class="publication-details">
                <span class="journal-name">${pub.journal}</span> (${pub.year})${pub.volume ? `, ${pub.volume}` : ''}${pub.issue ? `(${pub.issue})` : ''}${pub.pages ? `, ${pub.pages}` : ''}
            </div>
            
            <div class="publication-footer">
                <div>
                    <a href="https://doi.org/${pub.doi}" target="_blank" class="doi-link">
                        🔗 https://doi.org/${pub.doi}
                    </a>
                </div>
                
                <div class="metrics-section">
                    <span class="metrics-label">📊 Metrics:</span>
                    ${pub.citationCount !== null ? 
                        `<span class="citation-badge"> ${pub.citationCount} citations</span>` : 
                        '<span class="citation-loading"> N/A</span>'
                    }
                    <a href="${scholarSearchUrl}" target="_blank" class="scholar-badge">
                        🎓 Google Scholar
                    </a>
                    <div class="altmetric-embed" data-badge-type="donut" data-doi="${pub.doi}" data-badge-popover="right" data-badge-details="right"></div>
                </div>
            </div>
            
            ${pub.publisher ? `<div class="publisher-info">Published by ${pub.publisher}</div>` : ''}
        </div>
    `;
}

function calculateTotalCitations() {
    return publications.reduce((total, pub) => {
        return total + (pub.citationCount || 0);
    }, 0);
}

function updateUI() {
    const publicationsList = document.getElementById('publications-list');
    const emptyState = document.getElementById('empty-state');
    const publicationCount = document.getElementById('publication-count');
    const totalCitations = document.getElementById('total-citations');

    // Update publication count
    publicationCount.textContent = `${publications.length} Publication${publications.length !== 1 ? 's' : ''}`;
    
    // Update total citations count
    const totalCitationCount = calculateTotalCitations();
    totalCitations.textContent = `${totalCitationCount} Total Citation${totalCitationCount !== 1 ? 's' : ''}`;

    // Show/hide empty state and publications
    if (publications.length === 0) {
        emptyState.style.display = 'block';
        publicationsList.innerHTML = '';
    } else {
        emptyState.style.display = 'none';
        publicationsList.innerHTML = publications
            .map(pub => createPublicationCard(pub))
            .join('');
        
        // Reinitialize Altmetric badges
        if (window._altmetric_embed_init) {
            window._altmetric_embed_init();
        }
    }
}

async function loadPublications() {
    if (isLoading) return;
    
    isLoading = true;
    const loadingDiv = document.getElementById('loading');
    
    loadingDiv.style.display = 'block';
    
    publications = [];

    for (const doi of myDOIs) {
        const publication = await fetchPublication(doi);
        publications.push(publication);
        
        // Update UI after each publication loads to show progressive total
        updateUI();
    }

    // Sort publications by year (newest first)
    publications.sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return yearB - yearA;
    });

    loadingDiv.style.display = 'none';
    isLoading = false;
    
    updateUI();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    
    // Auto-load publications
    if (myDOIs.length > 0) {
        loadPublications();
    }
});
</script>
