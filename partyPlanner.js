class PartyManager {
  constructor() {
    this.parties = JSON.parse(localStorage.getItem('parties')) || [];
    this.currentId = this.parties.length ? Math.max(...this.parties.map(p => parseInt(p.id, 10))) + 1 : 1;
    this.cohortId = 1290; // Static cohort ID
  }

  async fetchExternalParties() {
    try {
      const response = await fetch('https://fsa-crud-2aa9294fe819.herokuapp.com/api/2410-FTB-ET-WEB-AM/events');
      if (!response.ok) {
        throw new Error('Failed to fetch external parties');
      }
      const externalParties = await response.json();

      console.log('Fetched external parties:', externalParties); // Debug log

      // Extract data array and check if it's valid
      if (externalParties.success && Array.isArray(externalParties.data)) {
        this.parties = externalParties.data.map(party => ({
          id: (this.currentId++).toString(), // Incremental ID
          description: party.description,
          date: party.date,
          location: party.location,
          cohortId: this.cohortId // Static cohort ID
        }));

        this.saveParties();
      } else {
        console.error('Unexpected data format:', externalParties);
      }
    } catch (error) {
      console.error('Error fetching external parties:', error);
    }
  }

  addParty(party) {
    this.parties.push({
      ...party,
      id: (this.currentId++).toString(),
      cohortId: this.cohortId
    });
    this.saveParties();
  }

  deleteParty(id) {
    this.parties = this.parties.filter(party => party.id !== id);
    this.saveParties();
  }

  getParties() {
    return this.parties;
  }

  saveParties() {
    localStorage.setItem('parties', JSON.stringify(this.parties));
  }
}

class UI {
  constructor(partyManager) {
    this.partyManager = partyManager;
    this.modal = document.getElementById('partyModal');
    this.partyForm = document.getElementById('partyForm');
    this.addPartyBtn = document.getElementById('addPartyBtn');
    this.cancelBtn = document.getElementById('cancelBtn');
    this.partyList = document.getElementById('partyList');
  }

  async init() {
    this.setupEventListeners();
    await this.partyManager.fetchExternalParties();
    this.displayParties();
  }

  setupEventListeners() {
    this.addPartyBtn.addEventListener('click', () => this.openModal());
    this.cancelBtn.addEventListener('click', () => this.closeModal());
    this.partyForm.addEventListener('submit', (e) => this.handleSubmit(e));
    this.partyList.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const partyId = e.target.closest('.party-card').dataset.id;
        this.deleteParty(partyId);
      }
    });
  }

  openModal() {
    this.partyForm.reset();
    this.modal.querySelector('#partyDescription').value = '';
    this.modal.querySelector('#partyDate').value = '';
    this.modal.querySelector('#partyLocation').value = '';
    this.modal.showModal();
  }

  closeModal() {
    this.modal.close();
  }

  handleSubmit(e) {
    e.preventDefault();

    const party = {
      description: document.getElementById('partyDescription').value,
      date: document.getElementById('partyDate').value,
      location: document.getElementById('partyLocation').value
    };

    this.partyManager.addParty(party);
    this.displayParties();
    this.closeModal();
  }

  deleteParty(id) {
    if (confirm('Are you sure you want to delete this party?')) {
      this.partyManager.deleteParty(id);
      this.displayParties();
    }
  }

  displayParties() {
    const parties = this.partyManager.getParties();
    this.partyList.innerHTML = parties.map(party => this.createPartyCard(party)).join('');
  }

  createPartyCard(party) {
    return `
      <div class="party-card" data-id="${party.id}">
        <button class="delete-btn">×</button>
        <div class="party-info">🆔 ID: ${party.id}</div>
        <div class="party-info">📝 Description: ${party.description}</div>
        <div class="party-info">📅 ${new Date(party.date).toLocaleDateString()}</div>
        <div class="party-info">📍 ${party.location}</div>
        <div class="party-info">🌟 Cohort ID: ${party.cohortId}</div>
      </div>
    `;
  }
}

const partyManager = new PartyManager();
const ui = new UI(partyManager);

// Initialize the application
ui.init();