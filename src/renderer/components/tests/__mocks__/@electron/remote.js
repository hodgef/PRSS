const mod =  {
    on: jest.mock(),
    getGlobal: () => jest.mock(),
    getCurrentWindow: () => ({
        on: () => {}
    })
};

module.exports = mod;