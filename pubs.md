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
            <a href="https://scholar.google.com/citations?user=kL0KaxQAAAAJ&hl=en" target="_blank" class="scholar-badge">🎓 My Google Scholar Profile</a>
        </p>
    </div>
    <!-- Error Box -->
    <div id="error-box" class="alert alert-danger" style="display: none;">
        <strong>Failed to load some publications:</strong>
        <div id="error-list"></div>
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
    '10.1111/mec.16051',
    '10.1111/eva.13216',
    '10.1016/j.jhazmat.2015.08.055',
    '10.1093/evolut/qpac061',
    '10.1073/pnas.2303043120',
    '10.1007/s10592-019-01218-9',
    '10.1186/s12862-019-1435-y',
    '10.1038/s41598-019-39793-z',
    '10.3390/d14070577',
    '10.1073/pnas.2320040121',
    '10.1371/journal.pcbi.1012566',
    '10.1007/s10709-019-00081-3',
    '10.1186/s12862-023-02191-1',
    '10.1111/mec.17210',
    '10.21203/rs.3.rs-6206868/v1',
    '10.22541/au.168371288.85881657/v1',
    '10.22541/au.174160442.25339601/v1'

];

// Google Scholar profile URL (optional)
const GOOGLE_SCHOLAR_URL = 'https://scholar.google.com/citations?user=kL0KaxQAAAAJ&hl=en&oi=ao';

let publications = [];
let errors = {};
let isLoading = false;

async function fetchCitationCount(doi) {
    try {
        // Try Crossref for citation count
        const response = await fetch(`https://api.crossref.org/works/${doi}`);
        if (response.ok) {
            const data = await response.json();
            return data.message['is-referenced-by-count'] || 0;
        }
    } catch (error) {
        console.warn(`Failed to fetch citation count for ${doi}:`, error);
    }
    return null;
}

async function fetchPublication(doi) {
    try {
        const response = await fetch(`https://api.crossref.org/works/${doi}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch publication for DOI: ${doi}`);
        }
        
        const data = await response.json();
        const work = data.message;
        
        // Fetch citation count
        const citationCount = await fetchCitationCount(doi);
        
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
            doi: work.DOI,
            url: work.URL,
            type: work.type || 'journal-article',
            originalDoi: doi,
            citationCount: citationCount
        };
    } catch (error) {
        throw new Error(`Error fetching ${doi}: ${error.message}`);
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
                        '<span class="citation-loading"> Loading...</span>'
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

function updateUI() {
    const publicationsList = document.getElementById('publications-list');
    const emptyState = document.getElementById('empty-state');
    const errorBox = document.getElementById('error-box');
    const errorList = document.getElementById('error-list');
    const publicationCount = document.getElementById('publication-count');

    // Update publication count
    publicationCount.textContent = `${publications.length} Publication${publications.length !== 1 ? 's' : ''}`;

    // Show/hide error box
    if (Object.keys(errors).length > 0) {
        errorList.innerHTML = Object.entries(errors)
            .map(([doi, error]) => `<div>• ${error}</div>`)
            .join('');
        errorBox.style.display = 'block';
    } else {
        errorBox.style.display = 'none';
    }

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
    errors = {};

    for (const doi of myDOIs) {
        try {
            const publication = await fetchPublication(doi);
            publications.push(publication);
        } catch (error) {
            errors[doi] = error.message;
        }
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

