
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
],
	prefix: "",
theme: {
  screens: {
    'xs': '400px',
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px',
  },
  container: {
    center: true,
    padding: '2rem',
    screens: {
      '2xl': '1400px'
    }
  },
extend: {
  transitionTimingFunction: {
    'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				'spektr-cyan-50': 'hsl(var(--spektr-cyan-50))'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
keyframes: {
'accordion-down': {
from: {
height: '0'
},
to: {
height: 'var(--radix-accordion-content-height)'
}
},
'accordion-up': {
from: {
height: 'var(--radix-accordion-content-height)'
},
to: {
height: '0'
}
},
'gradient-wave': {
'0%': {
'background-position': '0% 50%'
},
'50%': {
'background-position': '100% 50%'
},
'100%': {
'background-position': '0% 50%'
}
},
'carousel': {
'0%': {
transform: 'translateX(0)'
},
'100%': {
transform: 'translateX(-50%)'
}
}
},
animation: {
'accordion-down': 'accordion-down 0.2s ease-out',
'accordion-up': 'accordion-up 0.2s ease-out',
'gradient-wave': 'gradient-wave 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
'carousel': 'carousel 30s linear infinite'
			}
		}
	},
	plugins: [
  require("tailwindcss-animate"),
  function({ addUtilities }) {
    addUtilities({
      '.perspective-1000': {
        perspective: '1000px'
      },
      '.transform-style-3d': {
        'transform-style': 'preserve-3d'
      },
      '.backface-hidden': {
        'backface-visibility': 'hidden'
      },
      '.rotate-y-180': {
        transform: 'rotateY(180deg)'
      }
    })
  }
],
} satisfies Config;
