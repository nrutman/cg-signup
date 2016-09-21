(function() {

    angular
        // module definition
        .module('prov.cgSignup', ['ngAnimate', 'ngMessages', 'ngMaterial', 'ui.mask'])
        // constants
        .constant('MAX_MEMBERS', 12)
        // configuration
        .config(HttpInterceptorConfig)
        .config(MdThemeConfig)
        // filters
        .filter('time', TimeFilter)
        // services
        .service('apiService', ApiService)
        .service('errorService', ErrorService)
        .service('groupService', GroupService)
        .service('signupService', SignupService)
        // controllers
        .controller('AppCtrl', AppCtrl)
        .controller('FeedbackModalCtrl', FeedbackModalCtrl)
        // decorators
        .decorator('$exceptionHandler', ExceptionHandlerDecorator)
        // run block
        .run(AppRun);

    /**
     * @ngdoc Service
     * @name ApiService
     * @description Handles logic to communicate with API
     * @requires $http
     */
    function ApiService($http) {
        var self = this;
        self.request = request;

        function request(method, object, data, additionalConfig) {
            var config = angular.extend({
                method: method,
                url: 'api.php?object=' + object
            }, additionalConfig);

            if (data) {
                config.data = data;
            }

            return $http(config);
        }
    }

    /**
     * @ngdoc Controller
     * @name AppCtrl
     * @description Controller for the main sign-up page
     * @requires $location
     * @requires $mdDialog
     * @requires $q
     * @requires $timeout
     * @requires $window
     * @requires errorService
     * @requires groupService
     * @requires signupService
     */
    function AppCtrl($location, $mdDialog, $q, $timeout, $window, errorService, groupService, signupService, MAX_MEMBERS) {
        var self = this;
        self.getContainerClass = getContainerClass;
        self.currentGroup = {};
        self.currentSignup = {};
        self.currentStep = 1;
        self.data = {};
        self.getFormattedGroupType = getFormattedGroupType;
        self.getGroupClasses = getGroupClasses;
        self.getGroupCountLanguage = getGroupCountLanguage;
        self.getGroupEmptyCount = getGroupEmptyCount;
        self.getGroupToolTip = getGroupToolTip;
        self.groups = [];
        self.isGroupFull = isGroupFull;
        self.isLoading = true;
        self.isNextButtonDisabled = isNextButtonDisabled;
        self.isPreviousButtonDisabled = isPreviousButtonDisabled;
        self.isReadOnlyMode = false;
        self.joinGroup = joinGroup;
        self.next = next;
        self.openMap = openMap;
        self.previous = previous;
        self.totalSteps = 4;

        var validationMethods = [angular.noop, validateAboutForm, angular.noop];
        var groupMapByName;
        var groupMapById;
        var refreshTimer;

        initialize();
        detectReadOnlyMode();
        refreshGroupData(1000 * 60 * 5); // 5 minutes

        function initialize() {
            // query for data
            $q.all({
                groups: groupService.fetch(),
                signups: signupService.fetch()
            })
            .then(function(results) {
                // reset collections
                self.groups = [];
                groupMapById = {};
                groupMapByName = {};

                // process the groups
                processGroups(results.groups, results.signups);

                // update the status
                self.isLoading = false;
            });
        }

        function cancelRefreshTimer() {
            $timeout.cancel(refreshTimer);
        }

        function detectReadOnlyMode() {
            self.isReadOnlyMode = Boolean($location.search()['show-groups']);
            if (self.isReadOnlyMode) {
                self.currentStep = 3;
            }
        }

        function getContainerClass() {
            var sizeClasses = ['sm', 'sm', 'lg', 'sm'];
            var classes = [];

            classes.push(sizeClasses[self.currentStep - 1]);

            if (self.isReadOnlyMode) {
                classes.push('read-only');
            }

            return classes.join(' ');
        }

        function getFormattedGroupType(name) {
            if (name.indexOf('Famil') > -1) {
                return name;
            }
            return name + ' Group';
        }

        function getGroupClasses(group) {
            classes = ['group'];

            if (isGroupFull(group)) {
                classes.push('group-full');
            } else {
                classes.push('group-open');
            }

            return classes;
        }

        function getGroupCountLanguage(count) {
            if (count === 0) {
                return 'This group is empty. Be the first to sign up!';
            }
            if (count === 1) {
                return '1 person has signed up for this group';
            }

            return count + ' people have signed up for this group';
        }

        function getGroupEmptyCount(groupName) {
            var group = null;

            for (i=0; i<self.groups.length; i++) {
                if (self.groups[i].name === groupName) {
                    group = self.groups[i];
                    break;
                }
            }

            if (group === null || group.members.length >= MAX_MEMBERS) return new Array(0);

            return new Array(MAX_MEMBERS - group.members.length);
        }

        function getGroupToolTip(type) {
            var groupDescriptions = {
                'Daytime': 'A group that meets during the day for people with alternate schedules.',
                'Families with Adult Children': 'A group made up of parents who have at least one child 18 or older.',
                'Mens': 'A group of men who come together to sharpen one another and grow together.',
                'Mixed': 'A group made up of both men and women of various ages and seasons of life.',
                'Young Families': 'A group made up of parents with young children.',
                'Womens': 'A group of women who seek to grow together and encourage one another.'
            };
            var tooltip = groupDescriptions[type];

            if (!tooltip) {
                return 'This is a mock description of a group type.';
            }

            return tooltip;
        }

        function isGroupFull(group) {
            return (group.members.length >= MAX_MEMBERS);
        }

        function isNextButtonDisabled() {
            return self.isReadOnlyMode || self.currentStep >= self.totalSteps - 1;
        }

        function isPreviousButtonDisabled() {
            return self.isReadOnlyMode || (self.currentStep <= 1 || self.currentStep >= self.totalSteps);
        }

        function joinGroup(groupId, evt) {
            var selectedGroup = self.groups[groupMapById[groupId]];

            return $mdDialog.show(
                // show the confirmation modal
                $mdDialog.confirm()
                    .title('Would you like to join ' + selectedGroup.name + '?')
                    .textContent('To change your group you will need to contact the church office.')
                    .ok('Join Group')
                    .cancel('Cancel')
                    .targetEvent(evt)
            ).then(function() {
                // post the signup
                var newSignup = {
                    group_id: groupId,
                    first_name: self.data.firstName,
                    last_name: self.data.lastName,
                    email: self.data.email,
                    phone: self.data.phone
                };
                return signupService.create(newSignup, angular.noop);
            }, function() {
                return $q.reject(null);
            }).then(function(response) {
                // refresh the group data
                refreshGroupData();

                self.currentSignup = response.data;
                self.currentGroup = self.groups[groupMapById[self.currentSignup.group_id]];

                // show the feedback modal
                self.currentSignup.first_preference = Boolean(self.currentSignup.first_preference);
                return $mdDialog.show({
                    bindToController: true,
                    controller: 'FeedbackModalCtrl as ctrl',
                    escapeToClose: false,
                    locals: {
                        selectedGroup: self.groups[groupMapById[groupId]],
                        signup: self.currentSignup
                    },
                    templateUrl: 'app/templates/modals/feedbackModal.tpl.html'
                }).then(submitFeedback);
            }, function(response) {
                // error handling
                if (response === null) {
                    return $q.reject(null);
                }

                if (response.data.code == 3) {
                    // group is full
                    errorService.showFullGroup();
                    initialize();
                    return;
                }

                // default error handling
                errorService.showError();
            });
        }

        function openMap() {
            $window.open('https://drive.google.com/open?id=1h_zzQK-t2RCnXRpnTqfAj0RQIxw');
        }

        function previous() {
            self.currentStep = Math.max(self.currentStep - 1, 1);
        }

        function processGroups(groupData, signupData) {

            angular.forEach(groupData, function(group, i) {
                group.members = [];
                groupMapByName[group.name] = i;
                groupMapById[group.id] = i;
                self.groups.push(group);
            });

            angular.forEach(signupData, function(signup, i) {
                var group = self.groups[groupMapByName[signup.group_name]];
                if (group.members.length >= MAX_MEMBERS) {
                    return;
                }
                signup.full_name = [signup.first_name, signup.last_name].join(' ');
                group.members.push(signup);
            });

        }

        function next() {
            if (!validationMethods[self.currentStep - 1]()) {
                self.currentStep = Math.min(self.currentStep + 1, self.totalSteps);
            }

            if (self.currentStep == self.totalSteps) {
                cancelRefreshTimer();
            }
        }

        function refreshGroupData(interval) {
            interval = (angular.isNumber(interval) && interval > 0) ? interval : 0;

            refreshTimer = $timeout(function() {
                // refresh the group data
                initialize();

                // set the next interval
                if (interval > 0) {
                    refreshGroupData(interval);
                }
            }, interval);
        }

        function submitFeedback(signup) {
            return signupService.update(signup)
            .then(function(response) {
                self.currentSignup = response.data;
            }).then(self.next);
        }

        function validateAboutForm() {
            return self.aboutForm.$invalid;
        }
    }

    /**
     * @ngdoc service
     * @name errorService
     * @description Logic surrounding handling and displaying errors
     * @requires $mdDialog
     */
    function ErrorService($mdDialog) {
        var self = this;
        self.showError = showError;
        self.showFullGroup = showFullGroup;

        var defaultTitle = 'Oops! An error occurred!';
        var defaultMessage = 'Please refresh your browser and try again or contact the church office.';

        function showError(title, message) {
            return $mdDialog.show(
                $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title(title || defaultTitle)
                    .textContent(message || defaultMessage)
                    .ok('Got it!')
            );
        }

        function showFullGroup() {
            return showError('Bummer! That group is now full.', 'The groups have been updated. Please select a different group.');
        }
    }

    /**
     * @ngdoc decorator
     * @name ExceptionHandlerDecorator
     * @description Decorates $exceptionHandler with custom error logic
     * @requires $delegate
     * @requires $injector
     */
    function ExceptionHandlerDecorator($delegate, $injector) {
        return function(exception, cause) {
            var errorService = $injector.get('errorService');

            // show an alert
            errorService.showError();

            // run the delegate
            $delegate(exception, cause);
        };
    }

    /**
     * @ngdoc Controller
     * @name FeedbackModalCtrl
     * @description Controller for the group selection feedback modal
     * @requires $mdDialog
     */
    function FeedbackModalCtrl($mdDialog) {
        var self = this;
        self.complete = complete;
        self.selectedGroup = self.selectedGroup || {};
        self.signup = self.signup || {};

        function complete() {
            $mdDialog.hide(self.signup);
        }
    }

    /**
     * @ngdoc Service
     * @name GroupService
     * @description Logic for fetching and storing groups
     * @requires apiService
     */
    function GroupService(apiService) {
        var self = this;
        self.fetch = fetch;

        var groups = [];

        function fetch() {
            return apiService.request('GET', 'groups')
                .then(function(response) {
                    return response.data;
                });
        }
    }

    /**
     * @ngdoc Config
     * @name HttpInterceptorConfig
     * @description Configures interceptors for the $http service
     * @requires $httpProvider
     * @requires $q
     */
    function HttpInterceptorConfig($httpProvider) {
        $httpProvider.interceptors.push(function($injector) {
            return {
                'responseError': function(request) {
                    var $q = $injector.get('$q');
                    var errorService = $injector.get('errorService');
                    if (angular.isFunction(request.config.onError)) {
                        // do custom error logic
                        request.config.onError(request);
                    } else {
                        // show default error modal
                        errorService.showError();
                    }
                    return $q.reject(request);
                }
            };
        });
    }

    /**
     * @ngdoc Config
     * @name MdThemeConfig
     * @description Configure material design theme
     * @requires $mdThemingProvider
     */
    function MdThemeConfig($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue')
            .accentPalette('indigo');
    }

    /**
     * @ngdoc Service
     * @name SignupService
     * @description Logic for fetching and storing signups
     * @requires apiService
     */
    function SignupService(apiService) {
        var self = this;
        self.fetch = fetch;
        self.create = create;
        self.update = update;

        var signups = [];

        function create(signup, onError) {
            return apiService.request('POST', 'signup', signup, { 'onError': onError });
        }

        function fetch() {
            return apiService.request('GET', 'signups')
                .then(function(response) {
                    return response.data;
                });
        }

        function update(signup) {
            return apiService.request('PUT', 'signup', signup);
        }
    }

    function TimeFilter($filter) {
        return function(input) {
            if (!input) {
                return '';
            }
            var pieces = input.split(':');
            var pieceTypes = ['Hours', 'Minutes', 'Seconds', 'Milliseconds'];
            var dateTime = new Date();
            for (var i=0; i<pieceTypes.length; i++) {
                var value = (pieces.length >= i + 1) ? pieces[i] : 0;
                dateTime['set' + pieceTypes[i]](value);
            }
            return $filter('date')(dateTime, 'shortTime');
        };
    }

    /**
     * App Run Block
     */
    function AppRun(groupService, signupService) {}

})();
