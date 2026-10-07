document.addEventListener('DOMContentLoaded', () => {
    // Liquid Lens Cursor
    const cursor = document.getElementById('lens-cursor');
    const links = document.querySelectorAll('a, button, .door-card');

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            cursor.classList.add('hovering');
        });
        link.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovering');
        });
    });

    // 3D Tilt Effect for Door Cards
    const cards = document.querySelectorAll('.door-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
            const rotateY = ((x - centerX) / centerX) * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0)`;
        });
    });

    // Admin Modal CMS
    const btnAdmin = document.getElementById('btnAdmin');
    const modal = document.getElementById('adminModal');
    const closeAdmin = document.getElementById('closeAdmin');

    btnAdmin.addEventListener('click', () => {
        modal.classList.add('active');
    });

    closeAdmin.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if(e.target === modal) {
            modal.classList.remove('active');
        }
    });
});
