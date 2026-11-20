const { createApp } = Vue;

createApp({
  data() {
    return {
      sitename: 'After School Club',
      lessons: [
        { _id: '1',  topic: 'Math',     location: 'Ebene',         price: 1200, space: 5, icon: 'fa-calculator' },
        { _id: '2',  topic: 'Music',    location: 'Curepipe',      price: 1500, space: 5, icon: 'fa-music' },
        { _id: '3',  topic: 'Art',      location: 'Quatre Bornes', price: 1100, space: 5, icon: 'fa-paint-brush' },
        { _id: '4',  topic: 'Football', location: 'Rose Hill',     price: 900,  space: 5, icon: 'fa-futbol-o' },
        { _id: '5',  topic: 'Science',  location: 'Moka',          price: 1400, space: 5, icon: 'fa-flask' },
        { _id: '6',  topic: 'English',  location: 'Port Louis',    price: 1000, space: 5, icon: 'fa-book' },
        { _id: '7',  topic: 'Coding',   location: 'Ebene',         price: 1800, space: 5, icon: 'fa-code' },
        { _id: '8',  topic: 'Chess',    location: 'Vacoas',        price: 800,  space: 5, icon: 'fa-trophy' },
        { _id: '9',  topic: 'Drama',    location: 'Phoenix',       price: 1300, space: 5, icon: 'fa-star' },
        { _id: '10', topic: 'Swimming', location: 'Flic en Flac',  price: 1600, space: 5, icon: 'fa-life-ring' }
      ],
      sortBy: 'topic',
      sortOrder: 'asc',
      cart: [],
      showLessons: true            // NEW: true = lessons page, false = cart page
    };
  },

  computed: {
    sortedLessons() {
      const key = this.sortBy;
      const dir = this.sortOrder === 'asc' ? 1 : -1;
      return [...this.lessons].sort((a, b) => {
        const va = key === 'space' ? this.remaining(a) : a[key];
        const vb = key === 'space' ? this.remaining(b) : b[key];
        if (typeof va === 'string') {
          return va.localeCompare(vb) * dir;
        }
        return (va - vb) * dir;
      });
    },

    // NEW: one line per lesson in the cart, with how many spaces
    cartLines() {
      const lines = [];
      this.lessons.forEach(lesson => {
        const qty = this.cartCount(lesson._id);
        if (qty > 0) {
          lines.push({ lesson: lesson, qty: qty });
        }
      });
      return lines;
    },

    // NEW: total price of everything in the cart
    cartTotal() {
      return this.cartLines.reduce((sum, line) => sum + line.qty * line.lesson.price, 0);
    }
  },

  methods: {
    cartCount(id) {
      return this.cart.filter(item => item === id).length;
    },
    remaining(lesson) {
      return lesson.space - this.cartCount(lesson._id);
    },
    addToCart(lesson) {
      if (this.remaining(lesson) > 0) {
        this.cart.push(lesson._id);
      }
    },

    // NEW: remove ONE space of a lesson from the cart
    removeFromCart(id) {
      const index = this.cart.indexOf(id);
      if (index !== -1) {
        this.cart.splice(index, 1);
      }
      if (this.cart.length === 0) {
        this.showLessons = true;   // nothing left, go back to lessons
      }
    },

    // NEW: switch between the two pages
    toggleCart() {
      this.showLessons = !this.showLessons;
    }
  }
}).mount('#app');