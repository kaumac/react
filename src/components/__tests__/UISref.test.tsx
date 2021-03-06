declare var jest, describe, it, expect, beforeEach;

import * as React from "react";
import { shallow, mount, render } from "enzyme";
import * as sinon from "sinon";

import {UIRouterReact, UIRouter, UIView, UISref, ReactStateDeclaration, pushStateLocationPlugin, servicesPlugin} from "../../index";

const states = [{
  name: 'state',
  url: '/',
  component: () => <UISref to="state2"><a>state2</a></UISref>
}, {
  name: 'state2',
  url: '/state2',
  component: () => <span>state2</span>
}];

describe('<UISref>', () => {

  let router;
  beforeEach(() => {
    router = new UIRouterReact();
    router.plugin(servicesPlugin);
    router.plugin(pushStateLocationPlugin);
    router.stateService.defaultErrorHandler(()=>{});
    states.forEach(state => router.stateRegistry.register(state));
    router.start();
  });

  it('renders its child with injected props', () => {
    const wrapper = mount(<UIRouter router={router}><UIView/></UIRouter>);
    return router.stateService.go('state').then(() => {
      const props = wrapper.find('a').props();
      expect(typeof props.onClick).toBe('function');
      expect(props.href.includes('/state2')).toBe(true)
    });
  });

  it('triggers a transition to target state', () => {
    const mock = jest.fn();
    router.stateService.defaultErrorHandler(()=>{});
    router.transitionService.onBefore({ to: 'state2' }, () => { mock(true); return true; });
    const wrapper = mount(<UIRouter router={router}><UIView/></UIRouter>);
    return router.stateService.go('state').then(() => {
      const link = wrapper.find('a');
      const props = link.props();
      expect(typeof props.onClick).toBe('function');
      expect(props.href.includes('/state2')).toBe(true);
      link.simulate('click');
      expect(mock).toBeCalled();
    });
  });

  it('doesn\'t trigger a transition when middle-clicked/ctrl+clicked', () => {
    router.stateService.defaultErrorHandler(()=>{});
    const wrapper = mount(<UIRouter router={router}><UIView/></UIRouter>);
    return router.stateService.go('state').then(() => {
      let stub = sinon.stub(wrapper.node.router.stateService, 'go');
      const link = wrapper.find('a');
      link.simulate('click');
      link.simulate('click', { button: 1 });
      link.simulate('click', { metaKey: true });
      link.simulate('click', { ctrlKey: true });
      expect(stub.calledOnce).toBe(true);
    });
  })

  it('uses rootContext for options when not nested in a <UIView>', () => {
    const wrapper = mount(<UIRouter router={router}><UISref to="state"><a>link</a></UISref></UIRouter>);
    expect(wrapper.find(UISref).node.context.parentUIViewAddress).toBeUndefined();
    expect(wrapper.find(UISref).node.getOptions().relative.name).toBe('');
  });

  it('calls deregister active state checking when unmounting', () => {
    router.stateService.defaultErrorHandler(()=>{});
    const wrapper = mount(<UIRouter router={router}><UIView/></UIRouter>);
    let stub;
    return router.stateService.go('state').then(() => {
      stub = sinon.stub(wrapper.find(UISref).get(0), 'deregister');
      return router.stateService.go('state2');
    }).then(() => {
      expect(stub.calledOnce).toBe(true);
    });
  })

});