import { globalRequire, vendorModulePath } from '../../common/utils';

export const reactParser = (code: string) => {
    const babel = globalRequire(vendorModulePath('@babel/core'));
    const { code: output } = babel.transformSync(code, {
        presets: [
            ['@babel/env'],
            ['minify', { 'keepFnName': true }]
        ],
        plugins: [
            vendorModulePath('@babel/plugin-proposal-class-properties'),
            vendorModulePath('@babel/plugin-transform-react-jsx')
        ]
    });
    return output;
};