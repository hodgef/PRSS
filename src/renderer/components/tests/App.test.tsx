import Enzyme from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import * as React from "react";
import App from "../App";

Enzyme.configure({ adapter: new Adapter() });

jest.mock("../../../common/bootstrap", () => ({
  store: {
    get: () => ({}),
  },
  prssConfig: {
    version: "1.0.0",
  },
  clearHooks: () => {},
  setHook: () => {},
}));

it("app-content container should be defined", () => {
  const wrapper = Enzyme.mount(<App />, {
    attachTo: document.createElement("div"),
  });

  expect(wrapper.find(".app-content").exists()).toBe(true);
  expect(wrapper.find(".app-background").exists()).toBe(true);
});
