// Address of your back-end (change to your render.com URL when you deploy)
const API_BASE = 'http://localhost:3000';

const { createApp } = Vue;

createApp({
  data() {
    return {
      sitename: 'After School Club',
      lessons: [],
      teachers: [],
      loading: true,
      submitting: false,
      error: '',
      searchText: '',
      searchIds: null,
      searchTimer: null,
      teacherId: '',
      teacherLessonIds: null,
      sortBy: 'topic',
      sortOrder: 'asc',
      cart: [],
      showLessons: true,
      order: {
        name: '',
        phone: ''
      },
      orderMessage: ''
    };
  },

  created() {
    this.fetchLessons();
    this.fetchTeachers();
  },

  watch: {
    searchText() {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(this.runSearch, 300);
    }
  },

  computed: {
    visibleLessons() {
      return this.lessons.filter(lesson =>
        (this.searchIds === null || this.searchIds.includes(lesson._id)) &&
        (this.teacherLessonIds === null || this.teacherLessonIds.includes(lesson._id))
      );
    },
    sortedLessons() {
      const key = this.sortBy;
      const dir = this.sortOrder === 'asc' ? 1 : -1;
      return [...this.visibleLessons].sort((a, b) => {
        const va = key === 'space' ? this.remaining(a) : a[key];
        const vb = key === 'space' ? this.remaining(b) : b[key];
        if (typeof va === 'string') {
          return va.localeCompare(vb) * dir;
        }
        return (va - vb) * dir;
      });
    },
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
    cartTotal() {
      return this.cartLines.reduce((sum, line) => sum + line.qty * line.lesson.price, 0);
    },
    validName() {
      return /^[A-Za-z\s]+$/.test(this.order.name.trim());
    },
    validPhone() {
      return /^[0-9]+$/.test(this.order.phone);
    },
    canCheckout() {
      return this.validName && this.validPhone && this.cart.length > 0 && !this.submitting;
    }
  },

  methods: {
    async fetchLessons() {
      try {
        const response = await fetch(API_BASE + '/lessons');
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        this.lessons = await response.json();
        this.error = '';
      } catch (err) {
        this.error = 'Could not load lessons. Is the server running? (' + err.message + ')';
      } finally {
        this.loading = false;
      }
    },

    async fetchTeachers() {
      try {
        const response = await fetch(API_BASE + '/teachers');
        if (response.ok) {
          this.teachers = await response.json();
        }
      } catch (err) {
        console.log('Could not load teachers', err);
      }
    },

    async onTeacherChange() {
      if (!this.teacherId) {
        this.teacherLessonIds = null;
        return;
      }
      try {
        const response = await fetch(API_BASE + '/teachers/' + this.teacherId + '/lessons');
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        const results = await response.json();
        this.teacherLessonIds = results.map(lesson => lesson._id);
        this.error = '';
      } catch (err) {
        this.error = 'Could not load teacher lessons (' + err.message + ')';
      }
    },

    async runSearch() {
      const q = this.searchText.trim();
      if (!q) {
        this.searchIds = null;
        return;
      }
      try {
        const response = await fetch(API_BASE + '/search?q=' + encodeURIComponent(q));
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        const results = await response.json();
        this.searchIds = results.map(lesson => lesson._id);
        this.error = '';
      } catch (err) {
        this.error = 'Search failed (' + err.message + ')';
      }
    },

    imageUrl(lesson) {
      return API_BASE + '/' + lesson.image;
    },
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
    toggleCart() {
      this.showLessons = !this.showLessons;
      if (this.showLessons) {
        this.orderMessage = '';
      }
    },
    removeFromCart(id) {
      const index = this.cart.indexOf(id);
      if (index !== -1) {
        this.cart.splice(index, 1);
      }
      if (this.cart.length === 0) {
        this.showLessons = true;
      }
    },
    async checkout() {
      if (!this.canCheckout) {
        return;
      }
      this.submitting = true;
      this.error = '';

      try {
        const lines = this.cartLines;

        const orderResponse = await fetch(API_BASE + '/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.order.name.trim(),
            phone: this.order.phone,
            items: lines.map(line => ({ lessonId: line.lesson._id, spaces: line.qty }))
          })
        });
        if (!orderResponse.ok) {
          throw new Error('Order failed: HTTP ' + orderResponse.status);
        }

        for (const line of lines) {
          const newSpace = line.lesson.space - line.qty;
          const putResponse = await fetch(API_BASE + '/lessons/' + line.lesson._id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ space: newSpace })
          });
          if (!putResponse.ok) {
            throw new Error('Update failed: HTTP ' + putResponse.status);
          }
          line.lesson.space = newSpace;
        }

        this.orderMessage = 'Thank you ' + this.order.name.trim() + '! Your order has been submitted.';
        this.cart = [];
        this.order = { name: '', phone: '' };
      } catch (err) {
        this.error = err.message;
      } finally {
        this.submitting = false;
      }
    }
  }
}).mount('#app');