// FILE OF N.H.A.T

// Đối tượng `Validator`
function Validator (options) {
    
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};
    // get element form need Validate
    var formElement = document.querySelector(options.form);
    
    function validate(inputElement, rule) {
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        var errorMessage;


        // Lấy ra các rules của selector
        var rules = selectorRules[rule.selector];
        
        // Lặp qua từng rule và kiểm tra 
        // Nếu có lỗi sẽ dừng kiểm tra.
        for (var i = 0; i < rules.length; ++i) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default: 
                    errorMessage = rules[i](inputElement.value);

            }
            if (errorMessage) break;
        }

        
        if (errorMessage) {
            errorElement.innerText = errorMessage;
                getParent(inputElement, options.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = '';
                getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
        }
        return !errorMessage
    }

    if (formElement) {
        // Khi ấn submit form
        // Bỏ hành vi submit mặc định của form
        formElement.onsubmit = function (e) {
            e.preventDefault();
            
            var isFormValid = true;
            //  Lặp qua từng rule và validate 
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule); 
                if (!isValid) {
                    isFormValid = false;
                }
            });
            // xử lí nếu không có lỗi
            if (isFormValid) { 
                // Trường hợp submit custom
                if (typeof options.onSubmit === 'function') {
                    var enableInput = formElement.querySelectorAll('[name]');
                    var formValues = Array.from(enableInput).reduce(function (values, input) {
                        
                        switch(input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values
                                };
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                } 
                                values[input.name].push(input.value);
                                break;
                            case 'file': 
                                values[input.name] = input.files;
                                break;
                            default: 
                                values[input.name] = input.value
                        }

                        return values;
                    }, {}) 
                    // Truyền về func
                    options.onSubmit(formValues)
                } else {
                    // Trường hợp submit mặc định
                    formElement.submit();
                }
                
            } 
           
        }
        //lặp qua mỗi rule và xử lí (lắng nghe event blur, input,....)
        options.rules.forEach(function (rule) {
            // Lưu lại các rules cho mỗi input 
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(function (inputElement) {
                // xử lí blur khỏi input
                inputElement.onblur = function () {
                    validate(inputElement, rule); 
                }
                // Xử lí khi đang nhập input
                inputElement.oninput = function () {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerText = '';
                        getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                }
            })
        });
    }
}



// Định nghĩa rules
Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: function(value) {
            return value ? undefined : message || `Vui lòng nhập trường này!`
        }
    }
}

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function(value) {
            var regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regexEmail.test(value) ? undefined : message || `Email không hợp lệ`
        }
    }
}

Validator.minLength = function (selector, min, message) {
    return {
        selector: selector,
        test: function(value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} kí tự!`
        }
    }
}

Validator.isConfirmed = function (selector, getConfirmvalue, message) {
    return   {
        selector: selector,
        test: function (value) {
            return value === getConfirmvalue() ? undefined : message || `Giá trị nhập vào không chính xác`
        }
    }
}

