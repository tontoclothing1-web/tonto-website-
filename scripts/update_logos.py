import os
import re

def update_header():
    path = 'src/components/Header.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    if 'import Logo from' not in c:
        c = c.replace(
            "import { User, Bookmark, Search, ShoppingBag, Menu, X, ArrowUpRight, Shield } from 'lucide-react';",
            "import { User, Bookmark, Search, ShoppingBag, Menu, X, ArrowUpRight, Shield } from 'lucide-react';\nimport Logo from './Logo';"
        )

    # Replace old img tag
    c = re.sub(
        r'<img\s+src="/assets/logo\.png"\s+alt="TONTO Logo"\s+className="h-7 w-auto object-contain transition-transform duration-200 group-hover:opacity-90"\s*/>',
        '<Logo variant="header" alt="TONTO Clothing" />',
        c
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated Header.jsx")

def update_footer():
    path = 'src/components/Footer.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    if 'import Logo from' not in c:
        c = c.replace(
            "import { MapPin, ",
            "import Logo from './Logo';\nimport { MapPin, "
        )

    c = re.sub(
        r'<img\s+src="/assets/logo\.png"\s+alt="TONTO Clothing"\s+className="h-7 w-auto object-contain brightness-0 invert"\s*/>',
        '<Logo variant="footer" alt="TONTO Clothing" />',
        c
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated Footer.jsx")

def update_hero():
    path = 'src/components/HeroBanner.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    if 'import Logo from' not in c:
        c = c.replace(
            "import React, {",
            "import Logo from './Logo';\nimport React, {"
        )

    old_hero_img_pattern = r'<img\s+src="/assets/logo\.png"[\s\S]*?alt="TONTO Logo"[\s\S]*?className=\{`h-6 sm:h-7 w-auto object-contain brightness-0 invert drop-shadow-\[0_2px_8px_rgba\(0,0,0,0\.85\)\] transition-all duration-700 delay-100 ease-out \$\{[\s\S]*?mounted \? \'translate-y-0 opacity-100\' : \'translate-y-full opacity-0\'[\s\S]*?\`\}[\s\S]*?/>'
    
    replacement = '<Logo variant="hero" alt="TONTO Clothing" className={`transition-all duration-700 delay-100 ease-out ${\n                mounted ? \'translate-y-0 opacity-100\' : \'translate-y-full opacity-0\'\n              }`} />'

    c = re.sub(old_hero_img_pattern, replacement, c)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated HeroBanner.jsx")

def update_admin():
    path = 'src/components/AdminDashboard.jsx'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    c = re.sub(
        r'<img\s+src="/assets/logo\.png"\s+alt="TONTO Logo"\s+className="h-5 sm:h-6 w-auto object-contain brightness-0 invert"\s*/>',
        '<img src="/assets/tonto-lockup.svg" alt="TONTO Clothing" className="h-6 sm:h-7 w-auto object-contain" />',
        c
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated AdminDashboard.jsx")

if __name__ == '__main__':
    update_header()
    update_footer()
    update_hero()
    update_admin()
