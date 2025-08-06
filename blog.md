---
layout: page
title: Blog
subtitle: "Exploring the intersection of biology, data, and discovery 🧬"
css: "/assets/css/blog-style.css"
---

<style>
.blog-header {
  text-align: center;
  background: #FEF8F7;
  color: #030303;
  padding: 2.5rem 2rem;
  margin: 0 auto 3rem auto;
  border-radius: 25px;
  box-shadow: 0 15px 35px rgba(234, 97, 92, 0.15);
  max-width: 600px;
  border: 2px solid #fad1c5;
  position: relative;
}

.blog-header::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(45deg, #EA615C, #fad1c5, #FEF8F7, #EA615C);
  border-radius: 28px;
  z-index: -1;
  background-size: 200% 200%;
  animation: gradientShift 4s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.blog-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(45deg, #EA615C, #004aad);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.blog-header p {
  font-size: 1.2rem;
  color: #030303;
  margin-bottom: 0;
  opacity: 0.8;
}

.posts-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.post-card {
  background: #FEF8F7;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(234, 97, 92, 0.1);
  transition: all 0.3s ease;
  border: 2px solid #fad1c5;
  position: relative;
  overflow: hidden;
}

.post-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #EA615C, #fad1c5, #EA615C);
}

.post-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(234, 97, 92, 0.2);
  border-color: #EA615C;
}

.post-title {
  color: #030303;
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.post-title:hover {
  color: #004aad;
  text-decoration: none;
}

.post-subtitle {
  color: #EA615C;
  font-size: 1rem;
  font-weight: 400;
  margin-bottom: 1rem;
  font-style: italic;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  color: #030303;
  font-size: 0.9rem;
  opacity: 0.7;
}

.post-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.tag {
  background: linear-gradient(45deg, #EA615C, #fad1c5);
  color: #030303;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: lowercase;
  box-shadow: 0 2px 8px rgba(234, 97, 92, 0.3);
  border: 1px solid rgba(234, 97, 92, 0.2);
}

.post-excerpt {
  color: #030303;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  opacity: 0.8;
}

.read-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #EA615C;
  color: #FEF8F7;
  padding: 0.8rem 1.5rem;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(234, 97, 92, 0.3);
  border: 2px solid #EA615C;
}

.read-more-btn:hover {
  background: #FEF8F7;
  color: #EA615C;
  text-decoration: none;
  transform: translateX(5px);
  box-shadow: 0 6px 20px rgba(234, 97, 92, 0.4);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #FEF8F7;
  border: 2px solid #fad1c5;
  border-radius: 20px;
  margin-top: 2rem;
}

.empty-state h4 {
  color: #030303;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #030303;
  font-size: 1.1rem;
  opacity: 0.8;
}

.stats-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin: 1.5rem 0 0 0;
  padding: 1rem;
  background: rgba(250, 209, 197, 0.3);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(234, 97, 92, 0.2);
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #EA615C;
  margin-bottom: 0.2rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #030303;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .posts-container {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .blog-header {
    margin: 0 1rem 2rem 1rem;
    padding: 2rem 1rem;
  }
  
  .blog-header h1 {
    font-size: 2rem;
  }
  
  .stats-bar {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>

<div class="blog-header">
  <h1>🚀 Research Chronicles</h1>
  <p>Where computational biology meets cutting-edge discoveries</p>
  
  {% if site.posts.size > 0 %}
  <div class="stats-bar">
    <div class="stat">
      <div class="stat-number">{{ site.posts.size }}</div>
      <div class="stat-label">Posts</div>
    </div>
    <div class="stat">
      <div class="stat-number">{{ site.tags.size }}</div>
      <div class="stat-label">Topics</div>
    </div>
    <div class="stat">
      <div class="stat-number">{{ site.posts.first.date | date: '%Y' }}</div>
      <div class="stat-label">Latest</div>
    </div>
  </div>
  {% endif %}
</div>

{% if site.posts.size > 0 %}
<div class="posts-container">
  {% for post in site.posts %}
  <article class="post-card">
    <a href="{{ post.url | relative_url }}" style="text-decoration: none;">
      <h2 class="post-title">{{ post.title }}</h2>
      {% if post.subtitle %}
      <h3 class="post-subtitle">{{ post.subtitle }}</h3>
      {% endif %}
    </a>
    
    <div class="post-meta">
      <div class="post-date">
        <i class="far fa-calendar-alt"></i>
        {{ post.date | date: '%B %d, %Y' }}
      </div>
    </div>
    
    {% if post.tags.size > 0 %}
    <div class="post-tags">
      {% for tag in post.tags %}
        <span class="tag">#{{ tag }}</span>
      {% endfor %}
    </div>
    {% endif %}
    
    <div class="post-excerpt">
      {% if post.excerpt %}
        {{ post.excerpt | strip_html | truncatewords: 30 }}
      {% else %}
        {{ post.content | strip_html | truncatewords: 30 }}
      {% endif %}
    </div>
    
    <a href="{{ post.url | relative_url }}" class="read-more-btn">
      Read Full Story <i class="fas fa-arrow-right"></i>
    </a>
  </article>
  {% endfor %}
</div>

{% else %}
<div class="empty-state">
  <h4>🔬 Coming Soon!</h4>
  <p>Exciting bioinformatics insights and research discoveries are on their way.<br>
  Stay tuned for deep dives into computational biology, data science breakthroughs, and more!</p>
</div>
{% endif %}