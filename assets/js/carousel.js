const carousel = document.querySelector('.carousel');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

const testimonials = [
    {
        name: "Pallavi Sood",
        position: "RCI Registered Clinical Psychologist Assoc. | Psychotherapist | Neuromodulation| Building Marbles Health",
        linkedin: "https://www.linkedin.com/in/pallavi-sood-clinicalpsychologist",
        text: "Working with Naynee has been nothing less than wholesome. She wonderfully works one on one with clients and has excellent skills with rapport building and alliance. She facilitates a group with a lot of sensitivity. When it comes to family therapy, she is extremely sensitive towards different members of the family using the right kind of skills to navigate through difficult conversations and emotions."
    },
    {
        name: "Pallavi Singh",
        position: "Trauma & Grief Therapist at I Am Wellbeing",
        linkedin: "https://www.linkedin.com/in/pallavi-singh-82642a182",
        text: "Naynee is a passionate mental health worker. During my work with her, I could witness her empathetic connection with the people she supported. This care and concern was not just limited to the people she worked for, but also colleagues and fellow mental health professionals."
    },
    {
        name: "Dr. Vaishali Miglani",
        position: "Consultant Psychiatrist | Mental Health Advocate | Experienced in Clinical Psychiatry and Psychotherapy",
        linkedin: "https://www.linkedin.com/in/dr-vaishali-miglani-462bbb278",
        text: "During my tenure at PGIMS Rohtak, I was fortunate to experience working with Naynee. Her ability to establish a strong therapeutic alliance with clients is remarkable which was often displayed by patients and family members who would prefer to have therapy sessions with her. She possesses an innate sense of empathy and actively listens to clients' concerns, creating a safe and supportive environment which accelerates the treatment process, leading to positive outcomes especially increased compliance as I witnessed in several cases. I was always surprised to see the pace with which her clinical expertise and knowledge base has grown with time, probably because she is actively interested in case management, participating in clinical discussions, and never shying away from working in collaboration with multidisciplinary teams including psychiatrists, psychologists, and other healthcare professionals. She maintains professionalism and prioritises patient care with utmost sincerity."
    },
    {
        name: "Shafi Uddin",
        position: "Child Rights | Education | 21st Century Skills | Sustainability | Social Development | Youth Empowerment | Alternative Care | Child Care & Protection | Public Health",
        linkedin: "https://www.linkedin.com/in/shafi-uddin-30a483121",
        text: "Naynee has been a wonderful team member who is always driven by her passion and never give-up attitude. She is innovative and often brings some out of the box ideas to the table. She is reliable and firmly believes in participatory approach to work ensuring to take everyone along. Apart from her impressive qualifications, her love and passion to work in the mental health arena, her attention to detail and her creative approaches to a problem make her a skilful mental health professional."
    },
    {
        name: "Deepali Ruhela",
        position: "Manager- Partner Relations at Muskaan Dreams | Social Development Professional",
        linkedin: "https://www.linkedin.com/in/deepali-ruhela-664a8711a",
        text: "I had the privilege of working with Naynee during our time at Udayan Care. I was consistently impressed by her dedication and compassion. Naynee has a remarkable ability to connect with individuals and approaches each case with empathy and understanding, creating a safe space for clients to express themselves and work towards their goals. In addition to this, Naynee’s commitment to advocating for the well being of others, her exceptional interpersonal skills and her deep understanding of the field are a testament to her strong clinical expertise. I firmly believe that Naynee’s rich knowledge and passion to make a meaningful impact will be an invaluable asset to any organisation and she will certainly continue making meaningful impact in people’s lives. "
    }
];

let currentIndex = 0;

function createTestimonialElement(testimonial, index) {
    const div = document.createElement('div');
    div.className = 'testimonial';
    div.innerHTML = `
        <h3>${testimonial.name} <a href=${testimonial.linkedin} target="new"><i class="fa-brands fa-linkedin"></i></a></h3>
        <p>${testimonial.position}</p>
        <i>${testimonial.text}</i>
    `;
    return div;
}

function updateCarousel() {
    carousel.innerHTML = '';
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        carousel.appendChild(createTestimonialElement(testimonials[currentIndex], currentIndex));
    } else {
        const prevIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
        const nextIndex = (currentIndex + 1) % testimonials.length;

        carousel.appendChild(createTestimonialElement(testimonials[prevIndex], prevIndex));
        const activeTestimonial = createTestimonialElement(testimonials[currentIndex], currentIndex);
        activeTestimonial.classList.add('active');
        carousel.appendChild(activeTestimonial);
        carousel.appendChild(createTestimonialElement(testimonials[nextIndex], nextIndex));
    }
}

function showNext() {
    currentIndex = (currentIndex + 1) % testimonials.length;
    updateCarousel();
}

function showPrev() {
    currentIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
    updateCarousel();
}

nextBtn.addEventListener('click', showNext);
prevBtn.addEventListener('click', showPrev);

// Responsive behavior
function handleResize() {
    updateCarousel();
}

window.addEventListener('resize', handleResize);

// Initial setup
updateCarousel();

// Auto-scroll (optional)
// setInterval(showNext, 5000);